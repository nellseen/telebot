import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './client.js';
import { DB_FILE_PATH, DATA_DIR } from '../config.js';
import { logger } from '../logger.js';

export async function runMigrations(): Promise<{ applied: boolean; message: string }> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Check if tables already exist
    const tables: Array<{ name: string }> = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User';"
    );

    if (tables.length > 0) {
      logger.info('DB_MIGRATION', 'Database tables already exist. Schema verified.');
      return { applied: false, message: 'Schema already up-to-date' };
    }

    // Load initial migration file
    const migrationPath = path.resolve(process.cwd(), 'prisma/migrations/0_init/migration.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration SQL file not found at ${migrationPath}`);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    logger.info('DB_MIGRATION', 'Applying database migrations to SQLite...');

    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(DB_FILE_PATH);
    db.exec(migrationSql);
    db.close();

    logger.info('DB_MIGRATION', 'Migration applied successfully!');
    return { applied: true, message: 'Initial migration applied successfully' };
  } catch (error) {
    logger.error('DB_MIGRATION_ERROR', 'Failed to run database migrations', {
      error: error instanceof Error ? error.message : String(error),
      dbPath: DB_FILE_PATH,
    });
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<{ ok: boolean; sizeBytes: number; tablesCount: number }> {
  try {
    const stats = fs.existsSync(DB_FILE_PATH) ? fs.statSync(DB_FILE_PATH) : { size: 0 };
    const tables: Array<{ name: string }> = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    return {
      ok: true,
      sizeBytes: stats.size,
      tablesCount: tables.length,
    };
  } catch (error) {
    logger.error('DB_HEALTH_CHECK_ERROR', 'Health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, sizeBytes: 0, tablesCount: 0 };
  }
}
