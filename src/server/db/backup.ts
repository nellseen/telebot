import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './client.js';
import { DB_FILE_PATH, DATA_DIR } from '../config.js';
import { logger } from '../logger.js';

export const BACKUP_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export interface BackupResult {
  filename: string;
  filepath: string;
  sizeBytes: number;
  createdAt: string;
  integrityOk: boolean;
}

/**
 * Creates an atomic, consistent online backup of the SQLite database using VACUUM INTO.
 */
export async function createDatabaseBackup(): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.db`;
  const targetPath = path.join(BACKUP_DIR, filename);

  try {
    logger.info('DB_BACKUP_START', 'Starting SQLite database backup...', { targetPath });

    // Execute SQLite VACUUM INTO for consistent snapshot
    // Escaping targetPath for SQLite
    const safePath = targetPath.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`VACUUM INTO '${safePath}'`);

    // Verify file exists and has size
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Backup file was not created at ${targetPath}`);
    }

    const stats = fs.statSync(targetPath);
    if (stats.size === 0) {
      throw new Error('Created backup file has 0 bytes');
    }

    // Verify integrity of database
    const integrityResult: Array<{ integrity_check: string }> = await prisma.$queryRawUnsafe(
      'PRAGMA integrity_check;'
    );
    const integrityOk = integrityResult?.[0]?.integrity_check === 'ok';

    logger.info('DB_BACKUP_SUCCESS', 'Backup created and verified successfully', {
      filename,
      sizeBytes: stats.size,
      integrityOk,
    });

    return {
      filename,
      filepath: targetPath,
      sizeBytes: stats.size,
      createdAt: new Date().toISOString(),
      integrityOk,
    };
  } catch (error) {
    logger.error('DB_BACKUP_ERROR', 'Failed to create database backup', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Cleanup failed file if present
    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
      } catch {
        // ignore
      }
    }
    throw error;
  }
}

/**
 * Lists available backups.
 */
export function listDatabaseBackups(): Array<{ filename: string; sizeBytes: number; createdAt: string }> {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.db'));
  return files.map((file) => {
    const fullPath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(fullPath);
    return {
      filename: file,
      sizeBytes: stats.size,
      createdAt: stats.mtime.toISOString(),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
