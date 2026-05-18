import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY = process.env.ENCRYPTION_KEY || "v3ry-s3cr3t-k3y-f0r-c0stl0c1-3nt3rpr1s3";

/**
 * SOVEREIGN CRYPTO UTILITY
 * ═════════════════════════
 * Provides Zero-Knowledge encryption for contract files before 
 * they are persisted to external storage (Supabase).
 */
export class CryptoUtility {
  /**
   * Encrypts a buffer using AES-256-GCM.
   */
  static encrypt(data: Buffer): Buffer {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY.padEnd(32).slice(0, 32)), iv);
    
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: [IV (12 bytes)][AuthTag (16 bytes)][EncryptedData]
    return Buffer.concat([iv, tag, encrypted]);
  }

  /**
   * Decrypts an AES-256-GCM encrypted buffer.
   */
  static decrypt(data: Buffer): Buffer {
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY.padEnd(32).slice(0, 32)), iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}
