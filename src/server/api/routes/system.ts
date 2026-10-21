import os from 'node:os';
import { Router, Response } from 'express';
import { prisma } from '../../db/client.js';
import { checkDatabaseHealth } from '../../db/migrate.js';
import { createDatabaseBackup, listDatabaseBackups } from '../../db/backup.js';
import { supervisor } from '../../supervisor/supervisor.js';
import { getSystemLogs } from '../../logger.js';
import { requireAuth, AuthenticatedRequest } from '../middleware.js';
import { config } from '../../config.js';

export const systemRouter = Router();

// Public health check
systemRouter.get('/health', async (_req, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const healthy = dbHealth.ok;
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbHealth.ok ? 'connected' : 'error',
    timestamp: new Date().toISOString(),
  });
});

systemRouter.get('/ready', async (_req, res: Response) => {
  return res.json({ ready: true });
});

// Protected system diagnostics endpoints
systemRouter.get('/info', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const totalBots = await prisma.bot.count();
  const activeBots = supervisor.getActiveCount();
  const mem = process.memoryUsage();

  return res.json({
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    isTermux: config.isTermux,
    termuxPrefix: process.env.PREFIX || null,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssBytes: mem.rss,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      osTotalBytes: os.totalmem(),
      osFreeBytes: os.freemem(),
    },
    database: {
      ok: dbHealth.ok,
      sizeBytes: dbHealth.sizeBytes,
      tablesCount: dbHealth.tablesCount,
      path: 'data/app.db',
    },
    bots: {
      total: totalBots,
      active: activeBots,
      stopped: totalBots - activeBots,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/system/logs - Recent system logs
systemRouter.get('/logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const logs = getSystemLogs(limit);
  return res.json({ logs });
});

// POST /api/system/backup - Trigger backup
systemRouter.post('/backup', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const backup = await createDatabaseBackup();

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE_BACKUP',
        resourceType: 'Database',
        resourceId: backup.filename,
        metadataJson: JSON.stringify(backup),
      },
    });

    return res.json({ success: true, backup });
  } catch (error) {
    return res.status(500).json({
      error: 'BACKUP_FAILED',
      message: error instanceof Error ? error.message : 'Gagal membuat backup database',
    });
  }
});

// GET /api/system/backups - List backups
systemRouter.get('/backups', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const backups = listDatabaseBackups();
  return res.json({ backups });
});

// GET /api/system/audit-logs - List audit logs
systemRouter.get('/audit-logs', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return res.json({ auditLogs });
});
