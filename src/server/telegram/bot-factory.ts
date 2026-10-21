import { Bot as GrammyBot, GrammyError, HttpError } from 'grammy';
import { createMainMenuKeyboard, createBackKeyboard } from './keyboards.js';
import { BOT_COMMANDS } from './command-registry.js';
import {
  createRateLimiterMiddleware,
  createDeduplicationMiddleware,
  createLoggingMiddleware,
} from './middleware.js';
import { logger } from '../logger.js';
import { prisma } from '../db/client.js';

export interface BotCreationOptions {
  botId: string;
  name: string;
  username: string;
  telegramBotId: string;
  token: string;
  config: {
    welcomeEnabled: boolean;
    welcomeMessage: string;
    helpEnabled: boolean;
    inlineMenuEnabled: boolean;
    rateLimitEnabled: boolean;
  };
}

export function createTelegramBot(options: BotCreationOptions): GrammyBot {
  const { botId, name, token, config } = options;

  const bot = new GrammyBot(token);

  // 1. Deduplication
  bot.use(createDeduplicationMiddleware());

  // 2. Structured logging
  bot.use(createLoggingMiddleware(botId, name));

  // 3. Rate limiting
  bot.use(createRateLimiterMiddleware(config.rateLimitEnabled));

  // 4. Command: /start
  bot.command('start', async (ctx) => {
    if (!config.welcomeEnabled) {
      await ctx.reply('Bot aktif.');
      return;
    }

    const message = config.welcomeMessage || 'Halo! Selamat datang di bot ini.';
    const keyboard = config.inlineMenuEnabled ? createMainMenuKeyboard() : undefined;

    await ctx.reply(message, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  });

  // 5. Command: /help
  bot.command('help', async (ctx) => {
    if (!config.helpEnabled) {
      await ctx.reply('Menu bantuan dinonaktifkan oleh administrator.');
      return;
    }

    let text = '📖 <b>Daftar Perintah Bot</b>\n\n';
    for (const cmd of BOT_COMMANDS) {
      text += `• <b>/${cmd.command}</b> — ${cmd.description}\n`;
    }
    text += '\n<i>Dikelola melalui Telegram Bot Manager.</i>';

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: config.inlineMenuEnabled ? createMainMenuKeyboard() : undefined,
    });
  });

  // 6. Command: /id
  bot.command('id', async (ctx) => {
    const userId = ctx.from?.id ? String(ctx.from.id) : 'Tidak diketahui';
    const chatId = ctx.chat?.id ? String(ctx.chat.id) : 'Tidak diketahui';
    const chatType = ctx.chat?.type || 'private';

    const text =
      `🆔 <b>Informasi Identitas</b>\n\n` +
      `• <b>User ID:</b> <code>${userId}</code>\n` +
      `• <b>Chat ID:</b> <code>${chatId}</code>\n` +
      `• <b>Tipe Chat:</b> <code>${chatType}</code>`;

    await ctx.reply(text, { parse_mode: 'HTML' });
  });

  // 7. Command: /ping
  bot.command('ping', async (ctx) => {
    const startTime = Date.now();
    const sent = await ctx.reply('🏓 Mengukur waktu respon...');
    const latency = Date.now() - startTime;

    await ctx.api.editMessageText(
      ctx.chat.id,
      sent.message_id,
      `🏓 <b>Pong!</b>\n\n⚡ Waktu pemrosesan lokal: <b>${latency} ms</b>\n🟢 Status: <b>Online & Siap</b>`,
      { parse_mode: 'HTML' }
    );
  });

  // 8. Command: /about
  bot.command('about', async (ctx) => {
    const text =
      `🤖 <b>Tentang Bot Ini</b>\n\n` +
      `• <b>Nama:</b> ${options.name}\n` +
      `• <b>Username:</b> @${options.username}\n` +
      `• <b>Telegram ID:</b> <code>${options.telegramBotId}</code>\n` +
      `• <b>Platform Engine:</b> Telegram Bot Manager (grammY + Node.js)\n` +
      `• <b>Kompatibilitas:</b> Termux Android & Linux Server\n\n` +
      `<i>Gunakan /menu untuk membuka menu navigasi.</i>`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: config.inlineMenuEnabled ? createMainMenuKeyboard() : undefined,
    });
  });

  // 9. Command: /menu
  bot.command('menu', async (ctx) => {
    if (!config.inlineMenuEnabled) {
      await ctx.reply('Menu inline dinonaktifkan di pengaturan bot.');
      return;
    }
    await ctx.reply('📋 <b>Menu Utama Bot:</b>\nPilih salah satu opsi di bawah:', {
      parse_mode: 'HTML',
      reply_markup: createMainMenuKeyboard(),
    });
  });

  // 10. Callback Queries for inline keyboard
  bot.callbackQuery(/^menu:(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    await ctx.answerCallbackQuery(); // Always answer callback query to stop loading spinner

    switch (action) {
      case 'home': {
        const welcome = config.welcomeMessage || 'Halo! Selamat datang di bot ini.';
        await ctx.editMessageText(`🏠 <b>Beranda</b>\n\n${welcome}`, {
          parse_mode: 'HTML',
          reply_markup: createMainMenuKeyboard(),
        });
        break;
      }
      case 'help': {
        let helpText = '❓ <b>Pusat Bantuan</b>\n\n';
        for (const cmd of BOT_COMMANDS) {
          helpText += `• <b>/${cmd.command}</b> — ${cmd.description}\n`;
        }
        await ctx.editMessageText(helpText, {
          parse_mode: 'HTML',
          reply_markup: createBackKeyboard(),
        });
        break;
      }
      case 'status': {
        await ctx.editMessageText(
          `⚡ <b>Status Bot</b>\n\n` +
            `• Status Runtime: <b>Online</b>\n` +
            `• Mode Koneksi: <b>Long Polling</b>\n` +
            `• Rate Limiting: <b>${config.rateLimitEnabled ? 'Aktif' : 'Nonaktif'}</b>\n` +
            `• Waktu Pemeriksaan: <code>${new Date().toLocaleTimeString()}</code>`,
          {
            parse_mode: 'HTML',
            reply_markup: createBackKeyboard(),
          }
        );
        break;
      }
      case 'about': {
        await ctx.editMessageText(
          `ℹ️ <b>Informasi Bot</b>\n\n` +
            `• <b>Nama:</b> ${options.name}\n` +
            `• <b>Username:</b> @${options.username}\n` +
            `• <b>Engine:</b> grammY + SQLite\n`,
          {
            parse_mode: 'HTML',
            reply_markup: createBackKeyboard(),
          }
        );
        break;
      }
      case 'close': {
        await ctx.deleteMessage().catch(() => {
          ctx.editMessageText('Menu telah ditutup.');
        });
        break;
      }
      default:
        break;
    }
  });

  // Fallback for text messages
  bot.on('message:text', async (ctx) => {
    // If user sends unknown text, acknowledge politely
    if (!ctx.message.text.startsWith('/')) {
      await ctx.reply(
        'Pesan Anda diterima. Gunakan perintah <b>/help</b> untuk melihat daftar perintah atau <b>/menu</b> untuk membuka menu.',
        {
          parse_mode: 'HTML',
          reply_markup: config.inlineMenuEnabled ? createMainMenuKeyboard() : undefined,
        }
      );
    }
  });

  // Global Error Handler
  bot.catch((err) => {
    const ctx = err.ctx;
    const e = err.error;

    let errorDetail = 'Unknown error';
    if (e instanceof GrammyError) {
      errorDetail = `GrammyError: ${e.description} (code: ${e.error_code})`;
    } else if (e instanceof HttpError) {
      errorDetail = `HttpError: Could not contact Telegram servers: ${e.message}`;
    } else if (e instanceof Error) {
      errorDetail = e.message;
    }

    logger.error('BOT_ERROR_BOUNDARY', `Error while handling update in bot [${name}]`, {
      botId,
      updateId: ctx.update.update_id,
      error: errorDetail,
    });

    prisma.botLog
      .create({
        data: {
          botId,
          level: 'ERROR',
          event: 'RUNTIME_EXCEPTION',
          message: `Bot exception: ${errorDetail}`,
          metadataJson: JSON.stringify({ updateId: ctx.update.update_id }),
        },
      })
      .catch(() => {});
  });

  return bot;
}
