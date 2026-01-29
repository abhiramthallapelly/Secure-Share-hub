import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { api } from "@shared/routes";
import { z } from "zod";
import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";
import sharp from "sharp";
import { PDFDocument, rgb, degrees } from "pdf-lib";

// === ENCRYPTION HELPERS ===
const ALGORITHM = 'aes-256-cbc';
const MASTER_KEY_PATH = path.join(process.cwd(), 'server', 'keys', 'master.key');

// Ensure keys directory exists
if (!fs.existsSync(path.dirname(MASTER_KEY_PATH))) {
  fs.mkdirSync(path.dirname(MASTER_KEY_PATH), { recursive: true });
}

// Generate or Load Master RSA Key
let MASTER_PUBLIC_KEY: string;
let MASTER_PRIVATE_KEY: string;

function initializeMasterKey() {
  if (fs.existsSync(MASTER_KEY_PATH)) {
    const keys = JSON.parse(fs.readFileSync(MASTER_KEY_PATH, 'utf-8'));
    MASTER_PUBLIC_KEY = keys.publicKey;
    MASTER_PRIVATE_KEY = keys.privateKey;
  } else {
    // Generate new key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    MASTER_PUBLIC_KEY = publicKey;
    MASTER_PRIVATE_KEY = privateKey;
    fs.writeFileSync(MASTER_KEY_PATH, JSON.stringify({ publicKey, privateKey }));
    console.log("Generated new Master RSA Key Pair");
  }
}

initializeMasterKey();

// Multer setup
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 50 * 1024 * 1024 } 
});

// Helper for ID generation (avoiding ESM nanoid issues)
function generateId(length = 10) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);
  
  const objectStorage = new ObjectStorageService();
  const bucketName = objectStorage.getPrivateObjectDir().split('/')[1] || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 'default';

  // === FILE UPLOAD (ENCRYPTED) ===
  app.post(api.files.upload.path, isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file provided" });
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const aesKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(ALGORITHM, aesKey, iv);
      const encryptedBuffer = Buffer.concat([
        cipher.update(req.file.buffer),
        cipher.final()
      ]);

      const encryptedAesKey = crypto.publicEncrypt(MASTER_PUBLIC_KEY, aesKey);

      const storagePath = `encrypted/${generateId(16)}`;
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(storagePath);
      
      await file.save(encryptedBuffer, {
        metadata: {
          contentType: 'application/octet-stream',
          metadata: {
            originalName: req.file.originalname,
            ownerId: user.claims.sub
          }
        }
      });

      const fileRecord = await storage.createFile({
        ownerId: user.claims.sub,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        storagePath: storagePath,
        encryptionIv: iv.toString('hex'),
        encryptedAesKey: encryptedAesKey.toString('hex'),
        isPublic: false
      });

      res.status(201).json(fileRecord);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // === LIST FILES ===
  app.get(api.files.list.path, isAuthenticated, async (req: any, res) => {
    const user = req.user;
    const files = await storage.getFilesByOwner(user.claims.sub);
    res.json(files);
  });

  // === DOWNLOAD FILE (OWNER) ===
  app.get(api.files.download.path, isAuthenticated, async (req: any, res) => {
    const fileId = parseInt(req.params.id);
    const user = req.user;
    
    const fileRecord = await storage.getFile(fileId);
    if (!fileRecord) return res.status(404).json({ message: "File not found" });

    if (fileRecord.ownerId !== user.claims.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await streamDecryptedFile(fileRecord, res);
  });

  // === PUBLIC SHARE ACCESS ===
  app.get('/s/:token', async (req, res) => {
    const token = req.params.token;
    const link = await storage.getSharedLink(token);

    if (!link || link.isRevoked) return res.status(410).json({ message: "Link expired or revoked" });
    if (link.expiresAt && new Date() > link.expiresAt) return res.status(410).json({ message: "Link expired" });
    if (link.maxAccess && (link.accessCount || 0) >= link.maxAccess) return res.status(410).json({ message: "Link limit reached" });

    const fileRecord = await storage.getFile(link.fileId);
    if (!fileRecord) return res.status(404).json({ message: "File not found" });

    res.json({
      name: fileRecord.name,
      size: fileRecord.size,
      createdAt: fileRecord.createdAt,
      downloadUrl: `/api/links/${token}/download`
    });

    await storage.logAccess({
      fileId: fileRecord.id,
      linkId: link.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'view'
    });
  });

  // === PUBLIC DOWNLOAD (WITH WATERMARK) ===
  app.get('/api/links/:token/download', async (req, res) => {
    const token = req.params.token;
    const link = await storage.getSharedLink(token);

    if (!link || link.isRevoked || (link.expiresAt && new Date() > link.expiresAt)) {
      return res.status(410).json({ message: "Link invalid" });
    }

    const fileRecord = await storage.getFile(link.fileId);
    if (!fileRecord) return res.status(404).json({ message: "File not found" });

    await storage.incrementAccessCount(token);
    await storage.incrementDownloadCount(fileRecord.id);
    
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const watermarkText = `Shared with ${clientIp} on ${new Date().toISOString()}`;

    await storage.logAccess({
      fileId: fileRecord.id,
      linkId: link.id,
      ipAddress: clientIp as string,
      userAgent: req.get('User-Agent'),
      action: 'download'
    });

    await streamDecryptedFile(fileRecord, res, watermarkText);
  });

  // === CREATE SHARED LINK ===
  app.post(api.links.create.path.replace(':id', ':id'), isAuthenticated, async (req: any, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const user = req.user;
      
      const fileRecord = await storage.getFile(fileId);
      if (!fileRecord || fileRecord.ownerId !== user.claims.sub) {
        return res.status(404).json({ message: "File not found" });
      }

      const { expiresAt, maxAccess } = req.body;
      
      const link = await storage.createSharedLink({
        id: generateId(10),
        fileId: fileRecord.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxAccess: maxAccess || null,
      });

      res.status(201).json(link);
    } catch (e) {
      res.status(500).json({ message: "Failed to create link" });
    }
  });

  // === REVOKE LINK ===
  app.post(api.links.revoke.path, isAuthenticated, async (req: any, res) => {
    await storage.revokeLink(req.params.id);
    res.json({ success: true });
  });

  // === STATS ===
  app.get(api.stats.get.path, isAuthenticated, async (req: any, res) => {
    const user = req.user;
    const stats = await storage.getStats(user.claims.sub);
    res.json(stats);
  });

  // === DECRYPTION & WATERMARKING ===
  async function streamDecryptedFile(fileRecord: any, res: any, watermarkText?: string) {
    try {
      const aesKey = crypto.privateDecrypt(
        MASTER_PRIVATE_KEY,
        Buffer.from(fileRecord.encryptedAesKey, 'hex')
      );
      
      const iv = Buffer.from(fileRecord.encryptionIv, 'hex');
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(fileRecord.storagePath);
      
      const [exists] = await file.exists();
      if (!exists) throw new Error("File missing from storage");

      const decipher = crypto.createDecipheriv(ALGORITHM, aesKey, iv);
      
      // If we need to watermark, we must process the full buffer (streaming watermark is hard for PDF/Images)
      if (watermarkText && (fileRecord.mimeType.startsWith('image/') || fileRecord.mimeType === 'application/pdf')) {
        const chunks: Buffer[] = [];
        const stream = file.createReadStream().pipe(decipher);
        
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', async () => {
          let buffer = Buffer.concat(chunks);
          
          try {
            if (fileRecord.mimeType.startsWith('image/')) {
              // Image Watermark
              const image = sharp(buffer);
              const metadata = await image.metadata();
              const svgText = `
                <svg width="${metadata.width}" height="${metadata.height}">
                  <style>
                    .title { fill: rgba(255, 255, 255, 0.5); font-size: 24px; font-weight: bold; }
                  </style>
                  <text x="50%" y="95%" text-anchor="middle" class="title">${watermarkText}</text>
                </svg>`;
              
              buffer = await image
                .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
                .toBuffer();
                
            } else if (fileRecord.mimeType === 'application/pdf') {
              // PDF Watermark
              const pdfDoc = await PDFDocument.load(buffer);
              const pages = pdfDoc.getPages();
              pages.forEach(page => {
                const { width, height } = page.getSize();
                page.drawText(watermarkText, {
                  x: 50,
                  y: 50,
                  size: 20,
                  color: rgb(0.8, 0.8, 0.8),
                  rotate: degrees(45),
                  opacity: 0.5
                });
              });
              const pdfBytes = await pdfDoc.save();
              buffer = Buffer.from(pdfBytes);
            }
          } catch (e) {
            console.error("Watermark failed, serving original", e);
          }

          res.setHeader('Content-Type', fileRecord.mimeType);
          res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.name}"`);
          res.send(buffer);
        });
        
        stream.on('error', (e) => {
          console.error("Decryption stream error", e);
          if (!res.headersSent) res.status(500).json({ message: "Decryption failed" });
        });

      } else {
        // Direct stream for non-watermarked or unsupported types
        res.setHeader('Content-Type', fileRecord.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.name}"`);
        
        file.createReadStream()
          .pipe(decipher)
          .pipe(res);
      }
        
    } catch (error) {
      console.error("Decryption error:", error);
      if (!res.headersSent) res.status(500).json({ message: "Decryption failed" });
    }
  }

  return httpServer;
}
