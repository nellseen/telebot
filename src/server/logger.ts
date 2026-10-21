/**
 * Structured logger with redaction of sensitive credentials (tokens, passwords, keys).
 */

const REDACTION_PATTERNS = [
  // Telegram bot token pattern: digits followed by colon and alphanumeric characters
  /\b\d{8,12}:[A-Za-z0-9_-]{30,45}\b/g,
  // Key or secret values
  /("?(?:password|token|secret|encryptionKey|encryptedToken|authorization)"?\s*[:=]\s*"?)[^",\s}]+/gi,
];

export function redactSensitive(input: string): string {
  let sanitized = input;
  sanitized = sanitized.replace(REDACTION_PATTERNS[0], (match) => {
    const parts = match.split(':');
    return `${parts[0]}:••••••••••••••••••••`;
  });
  sanitized = sanitized.replace(REDACTION_PATTERNS[1], '$1[REDACTED]');
  return sanitized;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  botId?: string;
  workerId?: string;
  metadata?: Record<string, unknown>;
}

// In-memory ring buffer for recent system logs (up to 500 entries)
const SYSTEM_LOG_BUFFER: LogEntry[] = [];
const MAX_SYSTEM_LOGS = 500;

type LogListener = (entry: LogEntry) => void;
const listeners = new Set<LogListener>();

export function subscribeToLogs(listener: LogListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSystemLogs(limit = 100): LogEntry[] {
  return SYSTEM_LOG_BUFFER.slice(-limit);
}

function writeLog(level: LogLevel, event: string, message: string, meta?: Record<string, unknown>) {
  const sanitizedMessage = redactSensitive(message);
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message: sanitizedMessage,
    botId: meta?.botId as string | undefined,
    workerId: meta?.workerId as string | undefined,
    metadata: meta ? JSON.parse(redactSensitive(JSON.stringify(meta))) : undefined,
  };

  SYSTEM_LOG_BUFFER.push(entry);
  if (SYSTEM_LOG_BUFFER.length > MAX_SYSTEM_LOGS) {
    SYSTEM_LOG_BUFFER.shift();
  }

  // Format to stdout
  const colorMap: Record<LogLevel, string> = {
    DEBUG: '\x1b[90m',
    INFO: '\x1b[36m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
  };
  const reset = '\x1b[0m';
  const prefix = `${colorMap[level]}[${entry.timestamp}] [${level}] [${event}]${reset}`;
  console.log(`${prefix} ${sanitizedMessage}`, entry.metadata ? JSON.stringify(entry.metadata) : '');

  // Notify active WebSocket listeners
  for (const listener of listeners) {
    try {
      listener(entry);
    } catch {
      // ignore
    }
  }
}

export const logger = {
  debug: (event: string, msg: string, meta?: Record<string, unknown>) => writeLog('DEBUG', event, msg, meta),
  info: (event: string, msg: string, meta?: Record<string, unknown>) => writeLog('INFO', event, msg, meta),
  warn: (event: string, msg: string, meta?: Record<string, unknown>) => writeLog('WARN', event, msg, meta),
  error: (event: string, msg: string, meta?: Record<string, unknown>) => writeLog('ERROR', event, msg, meta),
};
