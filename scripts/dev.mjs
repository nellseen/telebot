#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');

console.log('⚡ === TELEGRAM BOT MANAGER: DEV LAUNCHER ===');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Spawn server using tsx
const child = spawn('npx', ['tsx', 'server.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' },
});

child.on('error', (err) => {
  console.error('❌ Gagal menjalankan server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
