export type BotStatus =
  | 'STOPPED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'RESTARTING'
  | 'ERROR';

export interface User {
  id: string;
  username: string;
}

export interface BotConfig {
  id: string;
  botId: string;
  welcomeEnabled: boolean;
  welcomeMessage: string;
  helpEnabled: boolean;
  inlineMenuEnabled: boolean;
  rateLimitEnabled: boolean;
  configurationJson: string;
  updatedAt: string;
}

export interface BotItem {
  id: string;
  name: string;
  username: string;
  telegramBotId: string;
  maskedToken: string;
  status: BotStatus;
  desiredState: BotStatus;
  autoStart: boolean;
  uptimeSeconds: number;
  startedAt?: string | null;
  stoppedAt?: string | null;
  lastErrorCode?: string | null;
  config?: BotConfig;
  createdAt: string;
  updatedAt: string;
}

export interface BotLogItem {
  id: string;
  botId: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  event: string;
  message: string;
  metadataJson: string;
  createdAt: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  event: string;
  message: string;
  botId?: string;
  workerId?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  isTermux: boolean;
  termuxPrefix: string | null;
  uptimeSeconds: number;
  memory: {
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
    osTotalBytes: number;
    osFreeBytes: number;
  };
  database: {
    ok: boolean;
    sizeBytes: number;
    tablesCount: number;
    path: string;
  };
  bots: {
    total: number;
    active: number;
    stopped: number;
  };
  timestamp: string;
}

export interface BackupItem {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadataJson: string;
  createdAt: string;
}
