-- CreateTable User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Bot
CREATE TABLE IF NOT EXISTS "Bot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "telegramBotId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "tokenKeyVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'STOPPED',
    "autoStart" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable BotConfig
CREATE TABLE IF NOT EXISTS "BotConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "welcomeEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Halo! Selamat datang di bot ini. Gunakan /help untuk melihat menu bantuan.',
    "helpEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "inlineMenuEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "rateLimitEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "configurationJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BotConfig_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable BotRuntime
CREATE TABLE IF NOT EXISTS "BotRuntime" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "desiredState" TEXT NOT NULL DEFAULT 'STOPPED',
    "observedState" TEXT NOT NULL DEFAULT 'STOPPED',
    "workerId" TEXT,
    "startedAt" DATETIME,
    "stoppedAt" DATETIME,
    "lastHeartbeatAt" DATETIME,
    "lastErrorCode" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BotRuntime_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable BotLog
CREATE TABLE IF NOT EXISTS "BotLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "event" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BotLog_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "Bot_telegramBotId_key" ON "Bot"("telegramBotId");
CREATE INDEX IF NOT EXISTS "Bot_ownerId_idx" ON "Bot"("ownerId");
CREATE INDEX IF NOT EXISTS "Bot_status_idx" ON "Bot"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "BotConfig_botId_key" ON "BotConfig"("botId");
CREATE UNIQUE INDEX IF NOT EXISTS "BotRuntime_botId_key" ON "BotRuntime"("botId");
CREATE INDEX IF NOT EXISTS "BotLog_botId_createdAt_idx" ON "BotLog"("botId", "createdAt");
CREATE INDEX IF NOT EXISTS "BotLog_level_idx" ON "BotLog"("level");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
