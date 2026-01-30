import crypto from 'crypto';
import { PasswordGenerator } from './passwordGenerator';

export interface EncryptionResult {
  encryptedData: Buffer;
  iv: string;
  authTag: string;
  salt: string;
  fileHash: string;
}

export interface DecryptionResult {
  decryptedData: Buffer;
  verified: boolean;
}

export class FileEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  static encrypt(fileBuffer: Buffer, keyFileBuffer: Buffer): EncryptionResult {
    const { password, salt, fileHash } = PasswordGenerator.generateFromFile(keyFileBuffer);
    
    const key = this.deriveKey(password);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt,
      fileHash,
    };
  }

  static decrypt(
    encryptedData: Buffer,
    keyFileBuffer: Buffer,
    salt: string,
    iv: string,
    authTag: string,
    expectedFileHash: string
  ): DecryptionResult {
    const verified = PasswordGenerator.verifyFileHash(keyFileBuffer, expectedFileHash);
    
    if (!verified) {
      throw new Error('Key file verification failed - the file does not match the original key file');
    }

    const password = PasswordGenerator.regeneratePassword(keyFileBuffer, salt);
    const key = this.deriveKey(password);
    
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    return {
      decryptedData: decrypted,
      verified: true,
    };
  }

  private static deriveKey(password: string): Buffer {
    return crypto.createHash('sha256').update(password).digest().slice(0, this.KEY_LENGTH);
  }

  static createEncryptedPackage(encryptionResult: EncryptionResult): Buffer {
    const metadata = JSON.stringify({
      iv: encryptionResult.iv,
      authTag: encryptionResult.authTag,
      salt: encryptionResult.salt,
      fileHash: encryptionResult.fileHash,
    });
    
    const metadataBuffer = Buffer.from(metadata, 'utf8');
    const metadataLengthBuffer = Buffer.alloc(4);
    metadataLengthBuffer.writeUInt32BE(metadataBuffer.length, 0);
    
    return Buffer.concat([
      metadataLengthBuffer,
      metadataBuffer,
      encryptionResult.encryptedData
    ]);
  }

  static parseEncryptedPackage(packageBuffer: Buffer): {
    encryptedData: Buffer;
    iv: string;
    authTag: string;
    salt: string;
    fileHash: string;
  } {
    const metadataLength = packageBuffer.readUInt32BE(0);
    const metadataBuffer = packageBuffer.slice(4, 4 + metadataLength);
    const encryptedData = packageBuffer.slice(4 + metadataLength);
    
    const metadata = JSON.parse(metadataBuffer.toString('utf8'));
    
    return {
      encryptedData,
      iv: metadata.iv,
      authTag: metadata.authTag,
      salt: metadata.salt,
      fileHash: metadata.fileHash,
    };
  }
}
