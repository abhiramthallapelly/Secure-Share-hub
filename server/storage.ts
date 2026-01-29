import { 
  users, files, sharedLinks, accessLogs,
  type User, type UpsertUser,
  type FileRecord,
  type SharedLink, type InsertSharedLink,
  type AccessLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

interface InsertFile {
  ownerId: string;
  name: string;
  size: number;
  mimeType: string;
  storagePath: string;
  encryptionIv: string;
  encryptedAesKey: string;
  isPublic?: boolean;
  maxDownloads?: number;
  expiresAt?: Date;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Files
  createFile(file: InsertFile): Promise<FileRecord>;
  getFile(id: number): Promise<FileRecord | undefined>;
  getFilesByOwner(ownerId: string): Promise<FileRecord[]>;
  deleteFile(id: number): Promise<void>;
  incrementDownloadCount(id: number): Promise<void>;

  // Shared Links
  createSharedLink(link: InsertSharedLink): Promise<SharedLink>;
  getSharedLink(token: string): Promise<SharedLink | undefined>;
  getLinksByFile(fileId: number): Promise<SharedLink[]>;
  revokeLink(token: string): Promise<void>;
  incrementAccessCount(token: string): Promise<void>;

  // Access Logs
  logAccess(log: { fileId: number, linkId?: string, ipAddress?: string, userAgent?: string, action: string }): Promise<void>;
  getStats(ownerId: string): Promise<{ totalFiles: number, totalDownloads: number, activeLinks: number }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Files
  async createFile(file: InsertFile): Promise<FileRecord> {
    const [record] = await db.insert(files).values(file).returning();
    return record;
  }

  async getFile(id: number): Promise<FileRecord | undefined> {
    const [record] = await db.select().from(files).where(eq(files.id, id));
    return record;
  }

  async getFilesByOwner(ownerId: string): Promise<FileRecord[]> {
    return await db.select().from(files).where(eq(files.ownerId, ownerId));
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async incrementDownloadCount(id: number): Promise<void> {
    await db.update(files)
      .set({ downloadCount: sql`${files.downloadCount} + 1` })
      .where(eq(files.id, id));
  }

  // Shared Links
  async createSharedLink(link: InsertSharedLink): Promise<SharedLink> {
    const [record] = await db.insert(sharedLinks).values(link).returning();
    return record;
  }

  async getSharedLink(token: string): Promise<SharedLink | undefined> {
    const [record] = await db.select().from(sharedLinks).where(eq(sharedLinks.id, token));
    return record;
  }

  async getLinksByFile(fileId: number): Promise<SharedLink[]> {
    return await db.select().from(sharedLinks).where(eq(sharedLinks.fileId, fileId));
  }

  async revokeLink(token: string): Promise<void> {
    await db.update(sharedLinks).set({ isRevoked: true }).where(eq(sharedLinks.id, token));
  }

  async incrementAccessCount(token: string): Promise<void> {
    await db.update(sharedLinks)
      .set({ accessCount: sql`${sharedLinks.accessCount} + 1` })
      .where(eq(sharedLinks.id, token));
  }

  // Access Logs
  async logAccess(log: { fileId: number, linkId?: string, ipAddress?: string, userAgent?: string, action: string }): Promise<void> {
    await db.insert(accessLogs).values(log);
  }

  async getStats(ownerId: string): Promise<{ totalFiles: number, totalDownloads: number, activeLinks: number }> {
    // This is a bit complex for a single query in drizzle without raw sql helper for aggregation across unrelated tables easily
    // We'll do separate queries for MVP simplicity
    const userFiles = await this.getFilesByOwner(ownerId);
    const totalFiles = userFiles.length;
    const totalDownloads = userFiles.reduce((acc, f) => acc + (f.downloadCount || 0), 0);
    
    // For active links, we need to join or query separately. 
    // Let's just count all links for user's files that are not revoked
    let activeLinks = 0;
    if (totalFiles > 0) {
      const fileIds = userFiles.map(f => f.id);
      const links = await db.select().from(sharedLinks)
        .where(and(
          sql`${sharedLinks.fileId} IN ${fileIds}`,
          eq(sharedLinks.isRevoked, false)
        ));
      activeLinks = links.length;
    }

    return { totalFiles, totalDownloads, activeLinks };
  }
}

export const storage = new DatabaseStorage();
