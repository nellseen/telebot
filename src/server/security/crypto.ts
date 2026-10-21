import crypto from 'node:crypto';
import { config } from '../config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Derive a 32-byte Buffer key from the configuration string
function getDerivedKey(secret: string = config.encryptionKey): Buffer {
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  // If not 64 hex chars, derive 32-byte key using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts plaintext string using AES-256-GCM authenticated encryption.
 * Output format: `iv:authTag:encryptedContent` in base64.
 */
export function encryptToken(token: string, keyString?: string): string {
  if (!token) throw new Error('Token to encrypt cannot be empty');
  const key = getDerivedKey(keyString);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts AES-256-GCM ciphertext format `iv:authTag:encryptedContent`.
 */
export function decryptToken(encryptedPayload: string, keyString?: string): string {
  if (!encryptedPayload) throw new Error('Encrypted payload cannot be empty');
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const key = getDerivedKey(keyString);
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Mask bot token for UI and logs: e.g. 123456789:AA••••••••••••••••••••••••
 */
export function maskToken(token: string): string {
  if (!token) return '••••••••';
  const colonIndex = token.indexOf(':');
  if (colonIndex === -1) {
    if (token.length <= 8) return '••••••••';
    return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
  }
  const botId = token.slice(0, colonIndex);
  const secretPart = token.slice(colonIndex + 1);
  const preview = secretPart.slice(0, 3);
  return `${botId}:${preview}${'•'.repeat(Math.max(16, secretPart.length - 3))}`;
}
