import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware.js';
import { encryptToken, decryptToken, maskToken } from '../../security/crypto.js';
import { validateTelegramToken } from '../../telegram/validator.js';
import { supervisor } from '../../supervisor/supervisor.js';
import { logger } from '../../logger.js';

export const botsRouter = Router();

// Protect all bot routes with authentication
botsRouter.use(requireAuth);

const CreateBotSchema = z.object({
  name: z.string().trim().min(1, 'Nama bot tidak boleh kosong').max(64),
  token: z.string().trim().min(10, 'Token bot tidak valid'),
  autoStart: z.boolean().optional().default(false),
});

const UpdateBotSchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
  autoStart: z.boolean().optional(),
});

const UpdateConfigSchema = z.object({
  welcomeEnabled: z.boolean().optional(),
  welcomeMessage: z.string().max(2000).optional(),
  helpEnabled: z.boolean().optional(),
  inlineMenuEnabled: z.boolean().optional(),
  rateLimitEnabled: z.boolean().optional(),
});

// GET /api/bots - List all bots
botsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bots = await prisma.bot.findMany({
      include: {
        config: true,
        runtime: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(
      bots.map(async (b) => {
        const liveStatus = await supervisor.getStatus(b.id);
        return {
          id: b.id,
          name: b.name,
          username: b.username,
          telegramBotId: b.telegramBotId,
          maskedToken: maskToken(decryptTokenSafe(b.encryptedToken)),
          status: liveStatus.observedState,
          desiredState: liveStatus.desiredState,
          autoStart: b.autoStart,
          uptimeSeconds: liveStatus.uptimeSeconds,
          startedAt: liveStatus.startedAt,
          stoppedAt: liveStatus.stoppedAt,
          lastErrorCode: liveStatus.lastErrorCode,
          config: b.config,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
      })
    );

    return res.json({ bots: enriched });
  } catch (error) {
    logger.error('BOTS_LIST_ERROR', 'Failed to retrieve bots', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal mengambil daftar bot' });
  }
});

// POST /api/bots - Add new bot
botsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = CreateBotSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Input tidak valid',
      });
    }

    const { name, token, autoStart } = parseResult.data;

    // 1. Verify token with Telegram Bot API
    const validation = await validateTelegramToken(token);
    if (!validation.valid || !validation.bot) {
      return res.status(400).json({
        error: 'INVALID_TELEGRAM_TOKEN',
        message: validation.error || 'Token ditolak oleh Telegram Bot API',
      });
    }

    const telegramBotId = String(validation.bot.id);
    const botUsername = validation.bot.username;

    // Check if bot already exists in database
    const existing = await prisma.bot.findUnique({
      where: { telegramBotId },
    });

    if (existing) {
      return res.status(409).json({
        error: 'BOT_ALREADY_EXISTS',
        message: `Bot @${botUsername} (ID: ${telegramBotId}) sudah terdaftar di sistem`,
      });
    }

    // Encrypt token
    const encryptedToken = encryptToken(token);

    // Save in transaction: Bot, BotConfig, BotRuntime, and initial log
    const newBot = await prisma.$transaction(async (tx) => {
      const bot = await tx.bot.create({
        data: {
          ownerId: req.user!.userId,
          name,
          telegramBotId,
          username: botUsername,
          encryptedToken,
          autoStart: autoStart || false,
          status: 'STOPPED',
        },
      });

      await tx.botConfig.create({
        data: {
          botId: bot.id,
          welcomeEnabled: true,
          welcomeMessage: `Halo! Selamat datang di @${botUsername}. Ketik /help untuk panduan atau /menu untuk membuka menu navigasi.`,
          helpEnabled: true,
          inlineMenuEnabled: true,
          rateLimitEnabled: true,
        },
      });

      await tx.botRuntime.create({
        data: {
          botId: bot.id,
          desiredState: 'STOPPED',
          observedState: 'STOPPED',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'CREATE_BOT',
          resourceType: 'Bot',
          resourceId: bot.id,
          metadataJson: JSON.stringify({ name, username: botUsername, telegramBotId }),
        },
      });

      await tx.botLog.create({
        data: {
          botId: bot.id,
          level: 'INFO',
          event: 'BOT_REGISTERED',
          message: `Bot @${botUsername} berhasil didaftarkan ke sistem`,
        },
      });

      return bot;
    });

    logger.info('BOT_CREATED', `Bot @${botUsername} created successfully`, { botId: newBot.id });

    // If autoStart was selected, trigger start
    if (autoStart) {
      supervisor.startBot(newBot.id).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      bot: {
        id: newBot.id,
        name: newBot.name,
        username: newBot.username,
        telegramBotId: newBot.telegramBotId,
        maskedToken: maskToken(token),
        status: autoStart ? 'STARTING' : 'STOPPED',
        autoStart: newBot.autoStart,
      },
    });
  } catch (error) {
    logger.error('BOT_CREATE_ERROR', 'Failed to create bot', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal menambahkan bot' });
  }
});

// GET /api/bots/:id - Get specific bot
botsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const bot = await prisma.bot.findUnique({
      where: { id },
      include: { config: true, runtime: true },
    });

    if (!bot) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Bot tidak ditemukan' });
    }

    const liveStatus = await supervisor.getStatus(bot.id);
    return res.json({
      bot: {
        ...bot,
        encryptedToken: undefined, // Never expose encrypted token directly
        maskedToken: maskToken(decryptTokenSafe(bot.encryptedToken)),
        liveStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal mengambil detail bot' });
  }
});

// PATCH /api/bots/:id - Update bot metadata
botsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = UpdateBotSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Input tidak valid' });
    }

    const updated = await prisma.bot.update({
      where: { id },
      data: parseResult.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_BOT',
        resourceType: 'Bot',
        resourceId: id,
        metadataJson: JSON.stringify(parseResult.data),
      },
    });

    return res.json({ success: true, bot: updated });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal memperbarui bot' });
  }
});

// DELETE /api/bots/:id - Delete bot
botsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const bot = await prisma.bot.findUnique({ where: { id } });
    if (!bot) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Bot tidak ditemukan' });
    }

    // Stop bot if currently running
    await supervisor.stopBot(id);

    // Delete in database (cascades to config, runtime, logs)
    await prisma.bot.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'DELETE_BOT',
        resourceType: 'Bot',
        resourceId: id,
        metadataJson: JSON.stringify({ name: bot.name, username: bot.username }),
      },
    });

    logger.info('BOT_DELETED', `Bot [${bot.name}] deleted cleanly.`);
    return res.json({ success: true, message: 'Bot berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal menghapus bot' });
  }
});

// POST /api/bots/:id/validate-token - Re-validate stored token
botsRouter.post('/:id/validate-token', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const bot = await prisma.bot.findUnique({ where: { id } });
    if (!bot) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bot tidak ditemukan' });

    const token = decryptToken(bot.encryptedToken);
    const result = await validateTelegramToken(token);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      valid: false,
      error: error instanceof Error ? error.message : 'Gagal memvalidasi token',
    });
  }
});

// POST /api/bots/:id/start
botsRouter.post('/:id/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const status = await supervisor.startBot(id);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'START_BOT',
        resourceType: 'Bot',
        resourceId: id,
      },
    });

    return res.json({ success: true, status });
  } catch (error) {
    return res.status(500).json({
      error: 'START_FAILED',
      message: error instanceof Error ? error.message : 'Gagal memulai bot',
    });
  }
});

// POST /api/bots/:id/stop
botsRouter.post('/:id/stop', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const status = await supervisor.stopBot(id);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'STOP_BOT',
        resourceType: 'Bot',
        resourceId: id,
      },
    });

    return res.json({ success: true, status });
  } catch (error) {
    return res.status(500).json({
      error: 'STOP_FAILED',
      message: error instanceof Error ? error.message : 'Gagal menghentikan bot',
    });
  }
});

// POST /api/bots/:id/restart
botsRouter.post('/:id/restart', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const status = await supervisor.restartBot(id);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'RESTART_BOT',
        resourceType: 'Bot',
        resourceId: id,
      },
    });

    return res.json({ success: true, status });
  } catch (error) {
    return res.status(500).json({
      error: 'RESTART_FAILED',
      message: error instanceof Error ? error.message : 'Gagal me-restart bot',
    });
  }
});

// GET /api/bots/:id/status
botsRouter.get('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const status = await supervisor.getStatus(id);
    return res.json(status);
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal mengambil status bot' });
  }
});

// GET /api/bots/:id/logs
botsRouter.get('/:id/logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const level = req.query.level as string | undefined;
    const query = req.query.q as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const whereClause: { botId: string; level?: string; message?: { contains: string } } = {
      botId: id,
    };
    if (level && level !== 'ALL') {
      whereClause.level = level;
    }
    if (query) {
      whereClause.message = { contains: query };
    }

    const logs = await prisma.botLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal mengambil log bot' });
  }
});

// DELETE /api/bots/:id/logs
botsRouter.delete('/:id/logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.botLog.deleteMany({ where: { botId: id } });
    return res.json({ success: true, message: 'Log bot berhasil dibersihkan' });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal membersihkan log' });
  }
});

// GET /api/bots/:id/config
botsRouter.get('/:id/config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const config = await prisma.botConfig.findUnique({ where: { botId: id } });
    if (!config) return res.status(404).json({ error: 'NOT_FOUND', message: 'Konfigurasi tidak ditemukan' });
    return res.json({ config });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal mengambil konfigurasi' });
  }
});

// PATCH /api/bots/:id/config
botsRouter.patch('/:id/config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = UpdateConfigSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Data konfigurasi tidak valid' });
    }

    const updated = await prisma.botConfig.update({
      where: { botId: id },
      data: parseResult.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_BOT_CONFIG',
        resourceType: 'BotConfig',
        resourceId: id,
        metadataJson: JSON.stringify(parseResult.data),
      },
    });

    return res.json({ success: true, config: updated });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal memperbarui konfigurasi' });
  }
});

function decryptTokenSafe(encrypted: string): string {
  try {
    return decryptToken(encrypted);
  } catch {
    return '';
  }
}
