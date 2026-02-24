import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY =
  process.env.RESUME_ENCRYPTION_KEY || 'jobportal_resume_key_32byteslong!';
const IV_LENGTH = 16;

export function encryptFile(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  // Prepend IV to encrypted data so we can use it during decryption
  return Buffer.concat([iv, encrypted]);
}

export function decryptFile(buffer: Buffer): Buffer {
  const iv = buffer.subarray(0, IV_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH);
  const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
