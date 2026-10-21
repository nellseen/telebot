import crypto from 'node:crypto';
import { Bot as GrammyBot } from 'grammy';
import { prisma } from '../db/client.js';
import { decryptToken } from '../security/crypto.js';
import { createTelegramBot } from '../telegram/bot-factory.js';
import { logger } from '../logger.js';
import { BotStatus, BotRuntimeStatus } from './types.js';

interface ActiveWorker {
  botId: string;
  workerId: string;
  bot: GrammyBot;
  startedAt: Date;
  retryCount: number;
  retryTimer?: NodeJS.Timeout;
}

type StateChangeListener = (status: BotRuntimeStatus) => void;

class BotSupervisor {
  private workers = new Map<string, ActiveWorker>();
  private stateListeners = new Set<StateChangeListener>();
  private heartbeatInterval?: NodeJS.Timeout;
  private readonly MAX_RETRIES = 5;

  constructor() {
    // Start heartbeat monitor every 15 seconds
    this.heartbeatInterval = setInterval(() => this.heartbeatTick(), 15000);
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private emitStateChange(status: BotRuntimeStatus) {
    for (const listener of this.stateListeners) {
      try {
        listener(status);
      } catch {
        // ignore listener errors
      }
    }
  }

  private async updateDbRuntime(
    botId: string,
    updates: {
      desiredState?: BotStatus;
      observedState?: BotStatus;
      workerId?: string | null;
      startedAt?: Date | null;
      stoppedAt?: Date | null;
      lastHeartbeatAt?: Date | null;
      lastErrorCode?: string | null;
    }
  ) {
    try {
      await prisma.botRuntime.upsert({
        where: { botId },
        create: {
          botId,
          desiredState: updates.desiredState || 'STOPPED',
          observedState: updates.observedState || 'STOPPED',
          workerId: updates.workerId,
          startedAt: updates.startedAt,
          stoppedAt: updates.stoppedAt,
          lastHeartbeatAt: updates.lastHeartbeatAt,
          lastErrorCode: updates.lastErrorCode,
        },
        update: updates,
      });

      if (updates.observedState) {
        await prisma.bot.update({
          where: { id: botId },
          data: { status: updates.observedState },
        });
      }
    } catch (err) {
      logger.error('SUPERVISOR_DB_ERROR', 'Failed to update runtime in database', {
        botId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async heartbeatTick() {
    const now = new Date();
    for (const [botId, worker] of this.workers.entries()) {
      try {
        await prisma.botRuntime.update({
          where: { botId },
          data: { lastHeartbeatAt: now },
        });

        const uptime = Math.floor((now.getTime() - worker.startedAt.getTime()) / 1000);
        this.emitStateChange({
          botId,
          desiredState: 'RUNNING',
          observedState: 'RUNNING',
          workerId: worker.workerId,
          startedAt: worker.startedAt.toISOString(),
          lastHeartbeatAt: now.toISOString(),
          uptimeSeconds: uptime,
        });
      } catch {
        // ignore
      }
    }
  }

  /**
   * Starts a Telegram bot instance.
   */
  public async startBot(botId: string): Promise<BotRuntimeStatus> {
    const existing = this.workers.get(botId);
    if (existing) {
      logger.warn('SUPERVISOR_ALREADY_RUNNING', `Bot ${botId} already has an active worker ${existing.workerId}`);
      return this.getStatus(botId);
    }

    const botRecord = await prisma.bot.findUnique({
      where: { id: botId },
      include: { config: true },
    });

    if (!botRecord) {
      throw new Error(`Bot dengan ID ${botId} tidak ditemukan`);
    }

    // Set desired state to RUNNING, observed to STARTING
    await this.updateDbRuntime(botId, {
      desiredState: 'RUNNING',
      observedState: 'STARTING',
      startedAt: new Date(),
      lastErrorCode: null,
    });

    this.emitStateChange({
      botId,
      desiredState: 'RUNNING',
      observedState: 'STARTING',
      uptimeSeconds: 0,
    });

    let token = '';
    try {
      token = decryptToken(botRecord.encryptedToken);
    } catch (err) {
      const msg = 'Kunci enkripsi tidak valid atau token korup';
      await this.updateDbRuntime(botId, {
        desiredState: 'RUNNING',
        observedState: 'ERROR',
        lastErrorCode: 'TOKEN_DECRYPTION_FAILED',
      });
      await prisma.botLog.create({
        data: {
          botId,
          level: 'ERROR',
          event: 'TOKEN_DECRYPTION_FAILED',
          message: msg,
        },
      });
      throw new Error(msg);
    }

    const workerId = `worker-${crypto.randomBytes(6).toString('hex')}`;
    const botConfig = botRecord.config || {
      welcomeEnabled: true,
      welcomeMessage: 'Halo! Selamat datang di bot ini.',
      helpEnabled: true,
      inlineMenuEnabled: true,
      rateLimitEnabled: true,
    };

    const bot = createTelegramBot({
      botId,
      name: botRecord.name,
      username: botRecord.username,
      telegramBotId: botRecord.telegramBotId,
      token,
      config: botConfig,
    });

    const activeWorker: ActiveWorker = {
      botId,
      workerId,
      bot,
      startedAt: new Date(),
      retryCount: 0,
    };

    this.workers.set(botId, activeWorker);

    // Start long polling asynchronously
    bot
      .start({
        drop_pending_updates: false,
        onStart: async (botInfo) => {
          logger.info('BOT_STARTED', `Bot @${botInfo.username} started successfully`, {
            botId,
            workerId,
          });

          await this.updateDbRuntime(botId, {
            observedState: 'RUNNING',
            workerId,
            startedAt: new Date(),
            lastHeartbeatAt: new Date(),
          });

          await prisma.botLog.create({
            data: {
              botId,
              level: 'INFO',
              event: 'RUNTIME_START',
              message: `Bot @${botInfo.username} online dan menerima update (worker: ${workerId})`,
            },
          });

          this.emitStateChange({
            botId,
            desiredState: 'RUNNING',
            observedState: 'RUNNING',
            workerId,
            startedAt: new Date().toISOString(),
            uptimeSeconds: 0,
          });
        },
      })
      .catch(async (error: unknown) => {
        await this.handleBotCrash(botId, error);
      });

    return this.getStatus(botId);
  }

  private async handleBotCrash(botId: string, error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const worker = this.workers.get(botId);
    this.workers.delete(botId);

    logger.error('BOT_CRASHED', `Bot ${botId} stopped with error: ${errorMsg}`);

    // Inspect if error is fatal (401 Unauthorized / invalid token or 409 Conflict)
    const isUnauthorized = errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized');
    const isConflict = errorMsg.includes('409') || errorMsg.toLowerCase().includes('conflict');

    let errorCode = 'CRASH';
    let shouldRetry = true;

    if (isUnauthorized) {
      errorCode = 'INVALID_TOKEN';
      shouldRetry = false;
    } else if (isConflict) {
      errorCode = 'POLLING_CONFLICT_409';
      shouldRetry = false;
    }

    await this.updateDbRuntime(botId, {
      observedState: 'ERROR',
      stoppedAt: new Date(),
      lastErrorCode: errorCode,
    });

    await prisma.botLog.create({
      data: {
        botId,
        level: 'ERROR',
        event: 'CRASH',
        message: `Bot berhenti akibat error: ${errorMsg} (${errorCode})`,
        metadataJson: JSON.stringify({ error: errorMsg, isConflict, isUnauthorized }),
      },
    });

    this.emitStateChange({
      botId,
      desiredState: 'RUNNING',
      observedState: 'ERROR',
      lastErrorCode: errorCode,
      uptimeSeconds: 0,
    });

    // Check if recovery retry should happen
    const currentRetries = worker ? worker.retryCount + 1 : 1;
    if (shouldRetry && currentRetries <= this.MAX_RETRIES) {
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, currentRetries), 30000);
      const jitter = Math.floor(Math.random() * 1000);
      const delay = baseDelay + jitter;

      logger.info('BOT_RECOVERY_SCHEDULED', `Scheduling restart for bot ${botId} in ${delay}ms (attempt ${currentRetries}/${this.MAX_RETRIES})`);

      const timer = setTimeout(async () => {
        try {
          const status = await this.startBot(botId);
          const newWorker = this.workers.get(botId);
          if (newWorker) newWorker.retryCount = currentRetries;
        } catch {
          // handled in startBot
        }
      }, delay);

      if (worker) worker.retryTimer = timer;
    } else if (currentRetries > this.MAX_RETRIES) {
      logger.error('BOT_MAX_RETRIES_REACHED', `Bot ${botId} reached max restart attempts (${this.MAX_RETRIES}). Leaving in ERROR state.`);
    }
  }

  /**
   * Stops a Telegram bot instance.
   */
  public async stopBot(botId: string): Promise<BotRuntimeStatus> {
    const worker = this.workers.get(botId);

    if (worker?.retryTimer) {
      clearTimeout(worker.retryTimer);
    }

    await this.updateDbRuntime(botId, {
      desiredState: 'STOPPED',
      observedState: 'STOPPING',
    });

    this.emitStateChange({
      botId,
      desiredState: 'STOPPED',
      observedState: 'STOPPING',
      uptimeSeconds: 0,
    });

    if (worker) {
      try {
        await worker.bot.stop();
      } catch (err) {
        logger.warn('BOT_STOP_ERROR', `Error during bot.stop() for ${botId}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
      this.workers.delete(botId);
    }

    await this.updateDbRuntime(botId, {
      observedState: 'STOPPED',
      workerId: null,
      stoppedAt: new Date(),
    });

    await prisma.botLog.create({
      data: {
        botId,
        level: 'INFO',
        event: 'RUNTIME_STOP',
        message: 'Bot dihentikan oleh pengguna dari dashboard',
      },
    });

    const status: BotRuntimeStatus = {
      botId,
      desiredState: 'STOPPED',
      observedState: 'STOPPED',
      uptimeSeconds: 0,
      stoppedAt: new Date().toISOString(),
    };

    this.emitStateChange(status);
    return status;
  }

  /**
   * Restarts a Telegram bot instance.
   */
  public async restartBot(botId: string): Promise<BotRuntimeStatus> {
    logger.info('BOT_RESTART', `Restarting bot ${botId}...`);

    await this.updateDbRuntime(botId, {
      observedState: 'RESTARTING',
    });

    this.emitStateChange({
      botId,
      desiredState: 'RUNNING',
      observedState: 'RESTARTING',
      uptimeSeconds: 0,
    });

    await this.stopBot(botId);
    // Short pause to ensure socket cleanup
    await new Promise((resolve) => setTimeout(resolve, 800));
    return await this.startBot(botId);
  }

  /**
   * Gets runtime status of a bot.
   */
  public async getStatus(botId: string): Promise<BotRuntimeStatus> {
    const worker = this.workers.get(botId);
    const dbRuntime = await prisma.botRuntime.findUnique({
      where: { botId },
    });

    const observedState = worker ? ('RUNNING' as BotStatus) : (dbRuntime?.observedState as BotStatus) || 'STOPPED';
    const desiredState = (dbRuntime?.desiredState as BotStatus) || 'STOPPED';

    const uptime = worker ? Math.floor((Date.now() - worker.startedAt.getTime()) / 1000) : 0;

    return {
      botId,
      desiredState,
      observedState,
      workerId: worker?.workerId || dbRuntime?.workerId || undefined,
      startedAt: worker?.startedAt?.toISOString() || dbRuntime?.startedAt?.toISOString() || null,
      stoppedAt: dbRuntime?.stoppedAt?.toISOString() || null,
      lastHeartbeatAt: dbRuntime?.lastHeartbeatAt?.toISOString() || null,
      lastErrorCode: dbRuntime?.lastErrorCode || null,
      uptimeSeconds: uptime,
    };
  }

  /**
   * Auto-starts bots configured with autoStart = true on server startup.
   */
  public async recoverAutoStartBots(): Promise<void> {
    try {
      const bots = await prisma.bot.findMany({
        where: { autoStart: true },
      });

      logger.info('SUPERVISOR_AUTOSTART', `Found ${bots.length} bot(s) configured for auto-start`);

      for (const b of bots) {
        // Stagger bot starts with 400ms interval for Termux friendliness
        await new Promise((r) => setTimeout(r, 400));
        this.startBot(b.id).catch((err) => {
          logger.error('AUTOSTART_BOT_FAILED', `Failed to auto-start bot ${b.name} (${b.id})`, {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    } catch (err) {
      logger.error('AUTOSTART_RECOVERY_ERROR', 'Failed during auto-start recovery', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Graceful shutdown stopping all workers cleanly.
   */
  public async gracefulShutdown(): Promise<void> {
    logger.info('SUPERVISOR_SHUTDOWN', `Shutting down ${this.workers.size} active bot workers...`);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    const stopPromises = Array.from(this.workers.keys()).map((botId) => this.stopBot(botId));
    await Promise.allSettled(stopPromises);
    logger.info('SUPERVISOR_SHUTDOWN', 'All bot workers stopped.');
  }

  public getActiveCount(): number {
    return this.workers.size;
  }
}

export const supervisor = new BotSupervisor();
