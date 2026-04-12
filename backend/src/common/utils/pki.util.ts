import * as crypto from 'crypto';

/**
 * Signs a buffer or string using an RSA private key.
 * Returns the signature as a base64 string.
 */
export function signData(data: Buffer | string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKeyPem, 'base64');
}

/**
 * Verifies a base64 signature against data using an RSA public key.
 * Returns true if signature is valid, false otherwise.
 */
export function verifySignature(
  data: Buffer | string,
  signatureBase64: string,
  publicKeyPem: string,
): boolean {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKeyPem, signatureBase64, 'base64');
  } catch {
    return false;
  }
}

/**
 * Computes a SHA-256 hash of a buffer and returns it as a hex string.
 * Used to create a fixed-size digest to sign (for files).
 */
export function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Computes a SHA-256 hash of a string and returns it as a hex string.
 * Used to create a fixed-size digest to sign (for messages).
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Generates a new RSA-2048 key pair.
 * Returns PEM-encoded publicKey and privateKey strings.
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}
