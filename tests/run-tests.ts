import assert from 'node:assert';
import crypto from 'node:crypto';
import { encryptToken, decryptToken, maskToken } from '../src/server/security/crypto.js';
import { hashPassword, verifyPassword } from '../src/server/security/auth.js';
import { redactSensitive } from '../src/server/logger.js';
import { BOT_COMMANDS } from '../src/server/telegram/command-registry.js';

console.log('🧪 === RUNNING TELEGRAM BOT MANAGER TEST SUITE ===\n');
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    });
}

async function run() {
  // 1. Encryption & Decryption
  await test('AES-256-GCM: Token encrypts and decrypts correctly', () => {
    const originalToken = '7123456789:AAFlm3k_SampleToken1234567890abcdefgh';
    const encrypted = encryptToken(originalToken);
    assert.notStrictEqual(encrypted, originalToken);
    assert.strictEqual(encrypted.split(':').length, 3, 'Ciphertext must contain iv:tag:data');

    const decrypted = decryptToken(encrypted);
    assert.strictEqual(decrypted, originalToken);
  });

  await test('AES-256-GCM: Decryption fails with invalid key or tampered data', () => {
    const originalToken = '7123456789:AAFlm3k_SampleToken1234567890abcdefgh';
    const encrypted = encryptToken(originalToken);
    const tampered = encrypted.slice(0, -4) + 'AAAA';
    assert.throws(() => decryptToken(tampered));
  });

  // 2. Token Masking
  await test('Security: Token masking hides sensitive key characters', () => {
    const rawToken = '7123456789:AAFlm3k_SecretKeyAbcdefgh123456789';
    const masked = maskToken(rawToken);
    assert(masked.startsWith('7123456789:AAF•'));
    assert(!masked.includes('SecretKeyAbcdefgh'));
    assert(masked.includes('••••'));
  });

  // 3. Password Hashing (PBKDF2)
  await test('Auth: PBKDF2 hashes password and verifies correctly', async () => {
    const password = 'mySuperSecurePassword123!';
    const hash = await hashPassword(password);
    assert.notStrictEqual(hash, password);
    assert(hash.includes(':'), 'Hash must contain salt:key');

    const isMatch = await verifyPassword(password, hash);
    assert.strictEqual(isMatch, true);

    const isWrong = await verifyPassword('wrongPassword', hash);
    assert.strictEqual(isWrong, false);
  });

  // 4. Log Redaction
  await test('Observability: Redaction filters tokens and credentials from logs', () => {
    const logMessage = 'User submitted token 7123456789:AAFlm3k_SampleToken1234567890abcdefgh with password="secretPassword123"';
    const sanitized = redactSensitive(logMessage);
    assert(!sanitized.includes('AAFlm3k_SampleToken1234567890abcdefgh'));
    assert(sanitized.includes('7123456789:••••••••••••••••••••'));
    assert(!sanitized.includes('secretPassword123'));
  });

  // 5. Command Registry
  await test('Telegram Template: Command registry contains all required built-in commands', () => {
    const requiredCommands = ['start', 'help', 'id', 'ping', 'about', 'menu'];
    const registered = BOT_COMMANDS.map((c) => c.command);
    for (const cmd of requiredCommands) {
      assert(registered.includes(cmd), `Command /${cmd} must be present in registry`);
    }
  });

  // 6. SQLite in-memory test
  await test('SQLite: Native DatabaseSync supports table operations and PRAGMA integrity check', async () => {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE test_bots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL
      );
      INSERT INTO test_bots (id, name, status) VALUES ('bot-1', 'Bot Alpha', 'STOPPED');
    `);
    const row = db.prepare('SELECT * FROM test_bots WHERE id = ?').get('bot-1') as { id: string; name: string };
    assert.strictEqual(row.name, 'Bot Alpha');

    const integrity = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    assert.strictEqual(integrity.integrity_check, 'ok');
    db.close();
  });

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
