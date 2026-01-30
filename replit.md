# VaultShare - Secure File Sharing Platform

## Overview
VaultShare is a secure file sharing platform for modern freelancers. It provides encrypted file storage, secure sharing with watermarking, and access tracking.

## Project Architecture

### Backend (Express 5 + TypeScript)
- `server/index.ts` - Main server entry point
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Database storage interface
- `server/db.ts` - Database connection (Drizzle ORM with PostgreSQL)

### Frontend (React + Vite)
- `client/src/` - React application source
- Uses Tailwind CSS for styling
- Shadcn/ui component library

### Crypto Modules
Located in `server/crypto/`:

#### Password Generator (`passwordGenerator.ts`)
Generates cryptographic passwords from files using PBKDF2:
- `generateFromFile(fileBuffer, customSalt?)` - Creates password, salt, and file hash
- `regeneratePassword(fileBuffer, salt)` - Recreates password with known salt
- `verifyFileHash(fileBuffer, expectedHash)` - Verifies file integrity

#### File Encryption (`fileEncryption.ts`)
AES-256-GCM encryption using file-derived passwords:
- `encrypt(fileBuffer, keyFileBuffer)` - Encrypts file using another file as key
- `decrypt(encryptedData, keyFileBuffer, salt, iv, authTag, fileHash)` - Decrypts with key file
- `createEncryptedPackage(encryptionResult)` - Bundles encrypted data with metadata
- `parseEncryptedPackage(packageBuffer)` - Extracts encrypted data and metadata

### API Endpoints

#### File-Based Encryption
- `POST /api/crypto/encrypt` - Encrypt a file using a key file
  - Form fields: `file` (to encrypt), `keyFile` (encryption key)
  - Returns: Encrypted file download
  
- `POST /api/crypto/decrypt` - Decrypt a file using the key file
  - Form fields: `encryptedFile`, `keyFile`
  - Returns: Decrypted file download
  
- `POST /api/crypto/generate-password` - Generate password info from key file
  - Form field: `keyFile`
  - Returns: JSON with password, salt, fileHash

#### File Management (requires authentication)
- `POST /api/files/upload` - Upload and encrypt a file
- `GET /api/files` - List user's files
- `GET /api/files/:id/download` - Download a file

#### Sharing
- `POST /api/files/:id/links` - Create a shared link
- `POST /api/links/:id/revoke` - Revoke a shared link
- `GET /s/:token` - Access shared file info
- `GET /api/links/:token/download` - Download shared file (with watermark)

## Recent Changes
- Added file-based encryption/decryption modules (`server/crypto/`)
- Added API endpoints for encrypting/decrypting files using key files

## User Preferences
- None recorded yet

## Development
- Run: `npm run dev`
- Build: `npm run build`
- Database push: `npm run db:push`
