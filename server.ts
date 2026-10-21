import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { config } from './src/server/config.js';
import { logger } from './src/server/logger.js';
import { connectDatabase, disconnectDatabase } from './src/server/db/client.js';
import { runMigrations } from './src/server/db/migrate.js';
import { supervisor } from './src/server/supervisor/supervisor.js';
import { initWebSocketServer } from './src/server/websocket/ws-server.js';
import { authRouter } from './src/server/api/routes/auth.js';
import { botsRouter } from './src/server/api/routes/bots.js';
import { systemRouter } from './src/server/api/routes/system.js';

async function bootstrap() {
  logger.info('BOOTSTRAP', '=== Memulai Telegram Bot Manager ===', {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    isTermux: config.isTermux,
    port: config.port,
  });

  // 1. Initialize SQLite Database & apply migrations
  try {
    await connectDatabase();
    await runMigrations();
  } catch (err) {
    logger.error('FATAL_DB_BOOTSTRAP', 'Gagal inisialisasi database SQLite. Periksa path dan izin disk.', {
      error: err instanceof Error ? err.message : String(err),
      dbPath: config.dbFilePath,
    });
    process.exit(1);
  }

  // 2. Setup Express application
  const app = express();

  // Basic security and parsing middlewares
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser(config.sessionSecret));

  // Request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url.startsWith('/api') && !req.url.includes('/health')) {
      logger.debug('HTTP_REQ', `${req.method} ${req.url}`);
    }
    next();
  });

  // 3. Mount REST API routers
  app.use('/api/auth', authRouter);
  app.use('/api/bots', botsRouter);
  app.use('/api/system', systemRouter);
  app.use('/api', systemRouter);

  // 4. Create HTTP Server
  const server = http.createServer(app);

  // 5. Initialize WebSocket Server for real-time telemetry
  initWebSocketServer(server);

  // 6. Mount Vite middleware for dev or static dist for prod
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!isProduction || !fs.existsSync(distPath)) {
    logger.info('DEV_MODE', 'Mounting Vite dev middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    logger.info('PROD_MODE', `Serving static assets from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 7. Start listening on configured port
  server.listen(config.port, config.host, async () => {
    logger.info('SERVER_READY', `🚀 Telegram Bot Manager berjalan di http://${config.host}:${config.port}`, {
      port: config.port,
      mode: isProduction ? 'production' : 'development',
    });

    // 8. Auto-start configured bots
    await supervisor.recoverAutoStartBots();
  });

  // 9. Graceful shutdown handler
  const shutdown = async (signal: string) => {
    logger.info('SHUTDOWN_SIGNAL', `Menerima sinyal ${signal}, melakukan shutdown teratur...`);
    try {
      await supervisor.gracefulShutdown();
      await disconnectDatabase();
      server.close(() => {
        logger.info('SHUTDOWN_COMPLETE', 'Server ditutup dengan aman.');
        process.exit(0);
      });
      // Force exit after 8s safety timeout
      setTimeout(() => {
        logger.warn('SHUTDOWN_TIMEOUT', 'Batas waktu shutdown tercapai, keluar paksa.');
        process.exit(0);
      }, 8000).unref();
    } catch (err) {
      logger.error('SHUTDOWN_ERROR', 'Terjadi error saat shutdown', {
        error: err instanceof Error ? err.message : String(err),
      });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
