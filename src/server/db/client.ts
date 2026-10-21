import { PrismaClient } from '@prisma/client';
import { ABSOLUTE_DATABASE_URL } from '../config.js';
import { logger } from '../logger.js';

// Initialize PrismaClient with configured absolute database url
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: ABSOLUTE_DATABASE_URL,
    },
  },
  log: ['warn', 'error'],
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('DB_CONNECT', 'Connected to SQLite database successfully', {
      url: ABSOLUTE_DATABASE_URL,
    });
  } catch (error) {
    logger.error('DB_CONNECT_ERROR', 'Failed to connect to SQLite database', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('DB_DISCONNECT', 'SQLite database connection closed cleanly');
  } catch (error) {
    logger.warn('DB_DISCONNECT_ERROR', 'Error disconnecting from database', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
