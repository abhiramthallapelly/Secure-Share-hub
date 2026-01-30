import crypto from 'crypto';

export interface PasswordGenerationResult {
  password: string;
  salt: string;
  fileHash: string;
}

export class PasswordGenerator {
  private static readonly SALT_LENGTH = 32;
  private static readonly PASSWORD_LENGTH = 32;
  private static readonly ITERATIONS = 100000;
  private static readonly DIGEST = 'sha512';

  static generateFromFile(fileBuffer: Buffer, customSalt?: string): PasswordGenerationResult {
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    const salt = customSalt || crypto.randomBytes(this.SALT_LENGTH).toString('hex');
    
    const password = crypto.pbkdf2Sync(
      fileBuffer,
      salt,
      this.ITERATIONS,
      this.PASSWORD_LENGTH,
      this.DIGEST
    ).toString('hex');

    return {
      password,
      salt,
      fileHash,
    };
  }

  static regeneratePassword(fileBuffer: Buffer, salt: string): string {
    return crypto.pbkdf2Sync(
      fileBuffer,
      salt,
      this.ITERATIONS,
      this.PASSWORD_LENGTH,
      this.DIGEST
    ).toString('hex');
  }

  static verifyFileHash(fileBuffer: Buffer, expectedHash: string): boolean {
    const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(actualHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }
}
