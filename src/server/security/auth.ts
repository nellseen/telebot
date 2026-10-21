import crypto from 'node:crypto';

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

/**
 * Hash password using PBKDF2 with 100,000 iterations and 16-byte random salt.
 * Returns `salt:hash` in hex.
 */
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LEN, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies password against stored `salt:hash`.
 */
export function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return resolve(false);

    const [salt, key] = parts;
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LEN, DIGEST, (err, derivedKey) => {
      if (err) return resolve(false);
      const keyBuffer = Buffer.from(key, 'hex');
      try {
        const matches = crypto.timingSafeEqual(derivedKey, keyBuffer);
        resolve(matches);
      } catch {
        resolve(false);
      }
    });
  });
}

// In-memory active session store
interface SessionData {
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(userId: string, username: string): string {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  sessions.set(sessionId, {
    userId,
    username,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return sessionId;
}

export function validateSession(sessionId: string | undefined): SessionData | null {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

export function destroySession(sessionId: string | undefined): void {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

// In-memory brute force protection
interface AttemptRecord {
  count: number;
  lastAttempt: number;
  blockedUntil: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute lockout after 5 failed attempts

export function checkLoginRateLimit(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const record = loginAttempts.get(identifier);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.blockedUntil > now) {
    return {
      allowed: false,
      waitSeconds: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  // If lockout expired, reset
  if (now - record.lastAttempt > LOCKOUT_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordLoginFailure(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { count: 0, lastAttempt: now, blockedUntil: 0 };
  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + LOCKOUT_MS;
  }

  loginAttempts.set(identifier, record);
}

export function recordLoginSuccess(identifier: string): void {
  loginAttempts.delete(identifier);
}
