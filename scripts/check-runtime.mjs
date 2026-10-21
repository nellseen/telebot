#!/usr/bin/env node
import os from 'node:os';
import fs from 'node:fs';

console.log('🔍 === TELEGRAM BOT MANAGER: RUNTIME CHECK ===');
console.log(`• Node.js Version: ${process.version}`);
console.log(`• Platform:        ${process.platform}`);
console.log(`• Architecture:    ${process.arch}`);

const isTermux = Boolean(process.env.TERMUX_VERSION || (process.env.PREFIX && process.env.PREFIX.includes('com.termux')));
console.log(`• Termux Detected: ${isTermux ? '✅ YES (Android Termux)' : 'ℹ️ NO (Standard Linux/Desktop/Cloud)'}`);

if (isTermux) {
  console.log(`  PREFIX: ${process.env.PREFIX}`);
  console.log('  Catatan Termux: Hindari menjalankan bot di background tanpa wakelock (termux-wake-lock)');
}

// Memory check
const mem = process.memoryUsage();
console.log(`• RSS Memory:      ${Math.round(mem.rss / 1024 / 1024)} MB`);
console.log(`• Heap Used:       ${Math.round(mem.heapUsed / 1024 / 1024)} MB`);
console.log(`• System Free Mem: ${Math.round(os.freemem() / 1024 / 1024)} MB / ${Math.round(os.totalmem() / 1024 / 1024)} MB`);

// SQLite check
try {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE _check (id INT);');
  console.log('• SQLite Engine:   ✅ Native SQLite engine available (Zero external binary dependency)');
} catch (e) {
  console.log('• SQLite Engine:   ℹ️ Using Prisma SQLite client');
}

console.log('✅ Runtime check completed successfully.\n');
