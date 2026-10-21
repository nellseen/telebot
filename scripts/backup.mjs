#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'app.db');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

console.log('📦 === TELEGRAM BOT MANAGER: DATABASE BACKUP ===');

if (!fs.existsSync(DB_FILE)) {
  console.error(`❌ File database tidak ditemukan di: ${DB_FILE}`);
  process.exit(1);
}

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `manual-backup-${timestamp}.db`);

try {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(DB_FILE);
  const safePath = backupFile.replace(/'/g, "''");
  db.exec(`VACUUM INTO '${safePath}'`);
  db.close();

  if (!fs.existsSync(backupFile)) {
    throw new Error('File backup tidak ditemukan setelah operasi VACUUM');
  }

  const stats = fs.statSync(backupFile);
  console.log(`✅ Backup database SQLite berhasil dibuat!`);
  console.log(`• File: ${backupFile}`);
  console.log(`• Ukuran: ${Math.round(stats.size / 1024)} KB`);
} catch (err) {
  console.error('❌ Gagal membuat backup database:', err.message);
  process.exit(1);
}
