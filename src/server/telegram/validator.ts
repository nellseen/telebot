import { redactSensitive, logger } from '../logger.js';

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  bot?: TelegramBotInfo;
  error?: string;
}

/**
 * Validates a Telegram bot token by querying the Telegram Bot API getMe endpoint.
 */
export async function validateTelegramToken(token: string): Promise<ValidationResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { valid: false, error: 'Token tidak boleh kosong' };
  }

  // Basic regex check before network request
  const tokenRegex = /^\d{8,12}:[A-Za-z0-9_-]{30,45}$/;
  if (!tokenRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Format token tidak valid. Token harus berupa angka ID bot diikuti tanda titik dua dan 30-45 karakter rahasia.',
    };
  }

  try {
    const url = `https://api.telegram.org/bot${trimmed}/getMe`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = (await response.json()) as { ok: boolean; result?: TelegramBotInfo; description?: string; error_code?: number };

    if (response.ok && data.ok && data.result) {
      logger.info('TOKEN_VALIDATION_SUCCESS', 'Token verified with Telegram Bot API', {
        botId: String(data.result.id),
        username: data.result.username,
      });
      return {
        valid: true,
        bot: data.result,
      };
    } else {
      const desc = data.description || `HTTP ${response.status} ${response.statusText}`;
      logger.warn('TOKEN_VALIDATION_FAILED', 'Telegram API rejected token', {
        error: redactSensitive(desc),
      });
      return {
        valid: false,
        error: `Telegram API menolak token: ${desc}`,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('TOKEN_VALIDATION_ERROR', 'Network error while contacting Telegram API', {
      error: redactSensitive(message),
    });
    return {
      valid: false,
      error: `Gagal terhubung ke api.telegram.org: ${message}. Pastikan koneksi internet aktif.`,
    };
  }
}
