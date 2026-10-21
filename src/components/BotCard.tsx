import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BotItem } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import {
  Play,
  Square,
  RefreshCw,
  Settings,
  FileText,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Clock,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  bot: BotItem;
  onStart: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onRestart: (id: string) => Promise<void>;
  onOpenSettings: (bot: BotItem) => void;
  onOpenLogs: (bot: BotItem) => void;
  onDelete: (bot: BotItem) => void;
  onValidateToken: (botId: string) => Promise<void>;
}

export function BotCard({
  bot,
  onStart,
  onStop,
  onRestart,
  onOpenSettings,
  onOpenLogs,
  onDelete,
  onValidateToken,
}: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState(false);

  const isRunning = bot.status === 'RUNNING';
  const isTransitioning = bot.status === 'STARTING' || bot.status === 'STOPPING' || bot.status === 'RESTARTING';

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(action);
    try {
      if (action === 'start') await onStart(bot.id);
      if (action === 'stop') await onStop(bot.id);
      if (action === 'restart') await onRestart(bot.id);
    } finally {
      setActionLoading(null);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(bot.maskedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      await onValidateToken(bot.id);
    } finally {
      setValidating(false);
    }
  };

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}j ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs} detik`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-5 rounded-3xl flex flex-col justify-between relative group hover:border-sky-500/30 transition-all duration-300"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base text-white tracking-tight truncate group-hover:text-sky-300 transition-colors">
              {bot.name}
            </h3>
            <a
              href={`https://t.me/${bot.username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors mt-0.5"
            >
              @{bot.username}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <StatusBadge status={bot.status} />
        </div>

        {/* Error Callout */}
        {bot.status === 'ERROR' && bot.lastErrorCode && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-semibold">Error Runtime:</span> {bot.lastErrorCode}
              <p className="text-[11px] text-rose-300/80 mt-0.5">
                Periksa log atau pastikan token valid & tidak ada worker polling ganda.
              </p>
            </div>
          </div>
        )}

        {/* Meta Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-white/[0.08] my-3">
          <div className="text-zinc-400">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Telegram ID</span>
            <span className="font-mono text-zinc-200">{bot.telegramBotId}</span>
          </div>
          <div className="text-zinc-400">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Auto-Start</span>
            <span className={bot.autoStart ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
              {bot.autoStart ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <div className="text-zinc-400 col-span-2 flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Uptime:</span>
              <span className="font-mono text-zinc-200">
                {isRunning ? formatUptime(bot.uptimeSeconds) : 'Offline'}
              </span>
            </div>
            {bot.startedAt && isRunning && (
              <span className="text-[10px] text-zinc-400 font-mono">
                Mulai: {new Date(bot.startedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Masked Token Bar */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-950/60 border border-white/[0.08] text-xs text-zinc-400 mb-4 font-mono">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-zinc-300">{bot.maskedToken}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={copyToken}
              title="Salin token ter-masking"
              className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleValidate}
              disabled={validating}
              title="Periksa koneksi token ke Telegram API"
              className="px-2 py-0.5 rounded-lg text-[10px] font-sans bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 disabled:opacity-50 transition-colors"
            >
              {validating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verifikasi'}
            </button>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="space-y-2.5 pt-1">
        {/* Primary Controls */}
        <div className="grid grid-cols-3 gap-2">
          {isRunning ? (
            <button
              onClick={() => handleAction('stop')}
              disabled={isTransitioning || actionLoading !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
            >
              {actionLoading === 'stop' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-amber-400" />
              )}
              Hentikan
            </button>
          ) : (
            <button
              onClick={() => handleAction('start')}
              disabled={isTransitioning || actionLoading !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
            >
              {actionLoading === 'start' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-emerald-400" />
              )}
              Jalankan
            </button>
          )}

          <button
            onClick={() => handleAction('restart')}
            disabled={isTransitioning || actionLoading !== null}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] disabled:opacity-50 transition-all active:scale-95"
          >
            {actionLoading === 'restart' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Restart
          </button>

          <button
            onClick={() => onOpenSettings(bot)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all active:scale-95"
          >
            <Settings className="w-3.5 h-3.5" />
            Setting
          </button>
        </div>

        {/* Secondary: Logs & Delete */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onOpenLogs(bot)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-sky-300 transition-colors py-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lihat Log Bot</span>
          </button>

          <button
            onClick={() => onDelete(bot)}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-400 transition-colors py-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
