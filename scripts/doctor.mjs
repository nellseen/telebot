#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'app.db');

console.log('🩺 === TELEGRAM BOT MANAGER: SYSTEM DOCTOR ===');

// 1. Data directory
if (fs.existsSync(DATA_DIR)) {
  console.log(`✅ [OK] Direktori data: ${DATA_DIR}`);
} else {
  console.log(`❌ [FAIL] Direktori data belum ada: ${DATA_DIR}`);
}

// 2. Database file & integrity
if (fs.existsSync(DB_FILE)) {
  const stats = fs.statSync(DB_FILE);
  console.log(`✅ [OK] Database SQLite ditemukan: ${DB_FILE} (${Math.round(stats.size / 1024)} KB)`);

  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(DB_FILE);
    const integrity = db.prepare('PRAGMA integrity_check').get();
    db.close();

    if (integrity.integrity_check === 'ok') {
      console.log('✅ [OK] SQLite PRAGMA integrity_check: OK');
    } else {
      console.log(`⚠️ [WARN] SQLite integrity check: ${integrity.integrity_check}`);
    }
  } catch (err) {
    console.log(`⚠️ [WARN] Gagal menjalankan integrity check: ${err.message}`);
  }
} else {
  console.log('ℹ️ [INFO] Database SQLite belum dibuat. Jalankan `npm run setup` terlebih dahulu.');
}

// 3. Telegram API Network connectivity
console.log('⏳ Memeriksa konektivitas ke api.telegram.org...');
https
  .get('https://api.telegram.org', (res) => {
    console.log(`✅ [OK] Koneksi internet ke Telegram Bot API berhasil (HTTP ${res.statusCode})`);
    finishDoctor();
  })
  .on('error', (err) => {
    console.log(`❌ [FAIL] Gagal menghubungi api.telegram.org: ${err.message}`);
    console.log('   Pastikan koneksi internet diaktifkan pada perangkat.');
    finishDoctor();
  });

function finishDoctor() {
  console.log('🩺 Pemeriksaan diagnosa selesai.\n');
  process.exit(0);
}
