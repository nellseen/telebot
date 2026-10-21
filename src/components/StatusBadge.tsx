import { BotStatus } from '../types.js';
import { Play, Square, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface Props {
  status: BotStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const isSm = size === 'sm';
  const textClass = isSm ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'RUNNING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${textClass}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Play className="w-3 h-3 fill-emerald-400" />
          ONLINE
        </span>
      );

    case 'STARTING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 ${textClass}`}
        >
          <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
          MEMULAI...
        </span>
      );

    case 'STOPPING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${textClass}`}
        >
          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
          MENGHENTIKAN...
        </span>
      );

    case 'RESTARTING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 ${textClass}`}
        >
          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
          RESTARTING...
        </span>
      );

    case 'ERROR':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${textClass}`}
        >
          <AlertCircle className="w-3 h-3 text-rose-400" />
          ERROR
        </span>
      );

    case 'STOPPED':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 ${textClass}`}
        >
          <Square className="w-2.5 h-2.5 fill-zinc-500 text-zinc-500" />
          OFFLINE
        </span>
      );
  }
}
