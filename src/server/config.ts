import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

// Load environment files (.env or process.env)
dotenv.config();

const ROOT_DIR = process.cwd();
export const DATA_DIR = path.resolve(ROOT_DIR, 'data');

// Ensure data directory exists idempotently
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Derive absolute SQLite database path
let rawDbUrl = process.env.DATABASE_URL || 'file:./data/app.db';
let dbFilePath = path.join(DATA_DIR, 'app.db');

if (rawDbUrl.startsWith('file:')) {
  const extractedPath = rawDbUrl.slice(5);
  if (path.isAbsolute(extractedPath)) {
    dbFilePath = extractedPath;
  } else {
    dbFilePath = path.resolve(ROOT_DIR, extractedPath);
  }
}

// Ensure database parent directory exists
const dbDir = path.dirname(dbFilePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Make sure DATABASE_URL is absolute for Prisma
export const ABSOLUTE_DATABASE_URL = `file:${dbFilePath}`;
export const DB_FILE_PATH = dbFilePath;

// Read or generate ENCRYPTION_KEY (32 bytes = 64 hex chars for AES-256-GCM)
let encryptionKey = process.env.ENCRYPTION_KEY;
const KEY_FILE_PATH = path.join(DATA_DIR, '.encryption_key');

if (!encryptionKey || encryptionKey.length < 32) {
  if (fs.existsSync(KEY_FILE_PATH)) {
    encryptionKey = fs.readFileSync(KEY_FILE_PATH, 'utf-8').trim();
  } else {
    // Generate secure 32-byte key
    encryptionKey = crypto.randomBytes(32).toString('hex');
    try {
      fs.writeFileSync(KEY_FILE_PATH, encryptionKey, { mode: 0o600 });
    } catch {
      // ignore
    }
  }
}

// Session secret
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: DATA_DIR,
  dbFilePath: DB_FILE_PATH,
  databaseUrl: ABSOLUTE_DATABASE_URL,
  encryptionKey: encryptionKey,
  sessionSecret: sessionSecret,
  isTermux: Boolean(process.env.TERMUX_VERSION || process.env.PREFIX?.includes('com.termux')),
};
