import { Context, NextFunction } from 'grammy';
import { prisma } from '../db/client.js';
import { logger } from '../logger.js';

// Rate limiting in-memory store: userId -> array of timestamps
const rateLimitMap = new Map<number, number[]>();
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const RATE_LIMIT_MAX_REQUESTS = 20;

// Deduplication store: recent update_id set
const recentUpdates = new Set<number>();
const MAX_RECENT_UPDATES = 2000;

export function createRateLimiterMiddleware(enabled = true) {
  return async (ctx: Context, next: NextFunction) => {
    if (!enabled || !ctx.from) {
      return await next();
    }

    const userId = ctx.from.id;
    const now = Date.now();
    const timestamps = (rateLimitMap.get(userId) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      try {
        await ctx.reply('⚠️ Anda mengirim pesan terlalu cepat. Mohon tunggu beberapa detik.');
      } catch {
        // ignore reply error
      }
      return;
    }

    timestamps.push(now);
    rateLimitMap.set(userId, timestamps);

    await next();
  };
}

export function createDeduplicationMiddleware() {
  return async (ctx: Context, next: NextFunction) => {
    const updateId = ctx.update.update_id;
    if (recentUpdates.has(updateId)) {
      return; // Skip duplicate update
    }

    recentUpdates.add(updateId);
    if (recentUpdates.size > MAX_RECENT_UPDATES) {
      const oldest = recentUpdates.values().next().value;
      if (oldest !== undefined) recentUpdates.delete(oldest);
    }

    await next();
  };
}

export function createLoggingMiddleware(botId: string, botName: string) {
  return async (ctx: Context, next: NextFunction) => {
    const start = Date.now();
    const updateType = Object.keys(ctx.update).find((k) => k !== 'update_id') || 'unknown';
    const userId = ctx.from?.id ? String(ctx.from.id) : 'anon';
    const username = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'User');

    let textPreview = '';
    if (ctx.message?.text) {
      textPreview = ctx.message.text.slice(0, 80);
    } else if (ctx.callbackQuery?.data) {
      textPreview = `Callback: ${ctx.callbackQuery.data}`;
    }

    logger.debug('TELEGRAM_UPDATE', `Bot [${botName}] received ${updateType} from ${username}`, {
      botId,
      updateType,
      userId,
    });

    try {
      await next();

      const durationMs = Date.now() - start;

      // Log event to database asynchronously
      prisma.botLog
        .create({
          data: {
            botId,
            level: 'INFO',
            event: updateType,
            message: `Processed ${updateType} from ${username}: "${textPreview}" (${durationMs}ms)`,
            metadataJson: JSON.stringify({
              userId,
              username,
              updateId: ctx.update.update_id,
              durationMs,
            }),
          },
        })
        .catch(() => {});
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('TELEGRAM_HANDLER_ERROR', `Error in bot [${botName}] handling ${updateType}`, {
        botId,
        error: errorMsg,
      });

      prisma.botLog
        .create({
          data: {
            botId,
            level: 'ERROR',
            event: 'HANDLER_ERROR',
            message: `Error processing ${updateType}: ${errorMsg}`,
            metadataJson: JSON.stringify({ error: errorMsg, userId }),
          },
        })
        .catch(() => {});

      throw err;
    }
  };
}
