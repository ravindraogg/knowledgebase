import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

export function encrypt(plaintext) {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedPayload: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

export function decrypt(payload) {
  const decipher = createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(payload.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

  let decrypted = decipher.update(payload.encryptedPayload, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
