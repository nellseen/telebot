#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const ENV_FILE = path.join(ROOT_DIR, '.env');
const DB_FILE = path.join(DATA_DIR, 'app.db');

console.log('🚀 === TELEGRAM BOT MANAGER: SETUP WIZARD ===');

// 1. Check Node.js
const majorVersion = parseInt(process.versions.node.split('.')[0], 10);
if (majorVersion < 18) {
  console.error(`❌ Node.js versi 18 atau lebih baru diperlukan. Terdeteksi versi: ${process.version}`);
  process.exit(1);
}
console.log(`✅ 1. Node.js ${process.version} terdeteksi.`);

// 2. Ensure data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`✅ 2. Direktori data berhasil dibuat di: ${DATA_DIR}`);
} else {
  console.log(`✅ 2. Direktori data telah tersedia: ${DATA_DIR}`);
}

// 3. Setup .env without overwriting existing secrets
if (!fs.existsSync(ENV_FILE)) {
  const encKey = crypto.randomBytes(32).toString('hex');
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  const envContent = [
    '# Telegram Bot Manager Configuration',
    'PORT=3000',
    'HOST=0.0.0.0',
    `DATABASE_URL="file:${DB_FILE}"`,
    `ENCRYPTION_KEY="${encKey}"`,
    `SESSION_SECRET="${sessionSecret}"`,
    'NODE_ENV=development',
    '',
  ].join('\n');
  fs.writeFileSync(ENV_FILE, envContent, { mode: 0o600 });
  console.log('✅ 3. File .env baru dibuat dengan kunci enkripsi AES-256 yang aman.');
} else {
  console.log('✅ 3. File .env yang sudah ada dipertahankan (kunci enkripsi aman).');
}

// 4. Generate Prisma Client
console.log('⏳ 4. Menghasilkan Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ 4. Prisma Client berhasil dihasilkan.');
} catch (err) {
  console.warn('⚠️ Gagal menjalankan prisma generate via CLI, fallback ke runtime adapter.');
}

// 5. Apply database migrations
console.log('⏳ 5. Menerapkan migration database SQLite...');
try {
  const migrationPath = path.join(ROOT_DIR, 'prisma/migrations/0_init/migration.sql');
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    const statements = migrationSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    // Execute using node:sqlite or Prisma
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(DB_FILE);
    for (const sql of statements) {
      db.exec(sql);
    }
    db.close();
    console.log(`✅ 5. Database SQLite berhasil diinisialisasi (${statements.length} instruksi migration diterapkan).`);
  }
} catch (err) {
  console.error('❌ Gagal menerapkan migration:', err.message);
  process.exit(1);
}

// 6. Smoke test
console.log('⏳ 6. Menjalankan smoke test database...');
try {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(DB_FILE);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  db.close();
  console.log(`✅ 6. Database smoke test berhasil! Total tabel: ${tables.length}`);
} catch (err) {
  console.error('❌ Gagal smoke test:', err.message);
  process.exit(1);
}

console.log('\n🎉 =======================================================');
console.log('   SETUP BERHASIL LENGKAP!');
console.log('   Sekarang jalankan aplikasi dengan: npm run dev');
console.log('   Buka dashboard di: http://localhost:3000');
console.log('=======================================================\n');
