import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth Models
export * from "./models/auth";
import { users } from "./models/auth";

// === FILES TABLE ===
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id), // Link to Replit Auth user
  name: text("name").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(), // Path in Object Storage (Encrypted file)
  encryptionIv: text("encryption_iv").notNull(), // Hex string
  encryptedAesKey: text("encrypted_aes_key").notNull(), // Hex string (RSA encrypted)
  downloadCount: integer("download_count").default(0),
  maxDownloads: integer("max_downloads"), // Null = unlimited
  expiresAt: timestamp("expires_at"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const filesRelations = relations(files, ({ one, many }) => ({
  owner: one(users, {
    fields: [files.ownerId],
    references: [users.id],
  }),
  sharedLinks: many(sharedLinks),
  accessLogs: many(accessLogs),
}));

// === SHARED LINKS TABLE ===
export const sharedLinks = pgTable("shared_links", {
  id: text("id").primaryKey(), // The unique share token (e.g. NanoID)
  fileId: integer("file_id").notNull().references(() => files.id),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Link specific expiry (optional override)
  maxAccess: integer("max_access"), // Link specific limit
  accessCount: integer("access_count").default(0),
  isRevoked: boolean("is_revoked").default(false),
});

export const sharedLinksRelations = relations(sharedLinks, ({ one, many }) => ({
  file: one(files, {
    fields: [sharedLinks.fileId],
    references: [files.id],
  }),
  accessLogs: many(accessLogs),
}));

// === ACCESS LOGS TABLE ===
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => files.id),
  linkId: text("link_id").references(() => sharedLinks.id), // Null if owner accessed directly
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  accessedAt: timestamp("accessed_at").defaultNow(),
  action: text("action").notNull(), // 'view', 'download'
});

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  file: one(files, {
    fields: [accessLogs.fileId],
    references: [files.id],
  }),
  link: one(sharedLinks, {
    fields: [accessLogs.linkId],
    references: [sharedLinks.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertFileSchema = createInsertSchema(files).omit({ 
  id: true, 
  createdAt: true, 
  downloadCount: true, 
  storagePath: true,
  encryptionIv: true,
  encryptedAesKey: true
});

export const insertLinkSchema = createInsertSchema(sharedLinks).omit({
  createdAt: true,
  accessCount: true,
  isRevoked: true
});

// === TYPES ===
export type FileRecord = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type SharedLink = typeof sharedLinks.$inferSelect;
export type InsertSharedLink = z.infer<typeof insertLinkSchema>;
export type AccessLog = typeof accessLogs.$inferSelect;

// Request Types
export type CreateFileRequest = {
  name: string;
  size: number;
  mimeType: string;
  maxDownloads?: number;
  expiresAt?: string; // ISO Date
};

// Response Types
export type FileResponse = FileRecord & {
  shareLink?: string; // Constructed URL
};
