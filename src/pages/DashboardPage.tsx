import { useState, useEffect } from 'react';
import { BotItem, SystemInfo, LogEntry } from '../types.js';
import { api } from '../services/api.js';
import {
  Bot,
  Play,
  Square,
  AlertTriangle,
  Database,
  Cpu,
  Clock,
  Plus,
  HardDrive,
  FileText,
  Activity,
  Terminal,
  RefreshCw,
} from 'lucide-react';

interface Props {
  bots: BotItem[];
  systemInfo: SystemInfo | null;
  recentLogs: LogEntry[];
  onAddBotClick: () => void;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
}

export function DashboardPage({
  bots,
  systemInfo,
  recentLogs,
  onAddBotClick,
  onNavigateTab,
  onRefresh,
}: Props) {
  const [uptimeSeconds, setUptimeSeconds] = useState(systemInfo?.uptimeSeconds || 0);

  useEffect(() => {
    if (systemInfo?.uptimeSeconds) {
      setUptimeSeconds(systemInfo.uptimeSeconds);
    }
  }, [systemInfo?.uptimeSeconds]);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalBots = bots.length;
  const activeBots = bots.filter((b) => b.status === 'RUNNING').length;
  const stoppedBots = bots.filter((b) => b.status === 'STOPPED').length;
  const errorBots = bots.filter((b) => b.status === 'ERROR').length;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}h ${h}j ${m}m`;
    if (h > 0) return `${h}j ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950/40 via-zinc-900 to-zinc-900 border border-sky-500/20 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[11px] font-semibold border border-sky-500/20 uppercase tracking-wide">
                Runtime Hub
              </span>
              {systemInfo?.isTermux && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> Android Termux Ready
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Pusat Kontrol Telegram Bot Manager
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl">
              Kelola, pantau kesehatan runtime, dan jalankan template interaktif multi-bot Telegram Anda melalui database SQLite persisten.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefresh}
              title="Refresh Data"
              className="p-2.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-colors border border-zinc-700/50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onAddBotClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-lg shadow-sky-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bot Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bots */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Total Bot</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-100">{totalBots}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Terdaftar di sistem</p>
          </div>
        </div>

        {/* Active Bots */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Bot Aktif (Running)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Play className="w-4 h-4 fill-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400">{activeBots}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Menerima polling update</p>
          </div>
        </div>

        {/* Stopped Bots */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Bot Berhenti</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center">
              <Square className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-300">{stoppedBots}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Status offline</p>
          </div>
        </div>

        {/* Error Bots */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Bot Mengalami Error</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${errorBots > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
              {errorBots}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {errorBots > 0 ? 'Membutuhkan perhatian' : 'Semua runtime sehat'}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics: Health & Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Database Status Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-xs text-zinc-200">Database SQLite</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OK • Terkoneksi
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Lokasi File:</span>
              <span className="font-mono text-zinc-200">data/app.db</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Ukuran Database:</span>
              <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.database?.sizeBytes || 0)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Jumlah Tabel:</span>
              <span className="font-mono text-zinc-200">{systemInfo?.database?.tablesCount || 6} tabel</span>
            </div>
          </div>
        </div>

        {/* System Memory Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-xs text-zinc-200">Memori Node.js</h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Heap: {formatBytes(systemInfo?.memory?.heapUsedBytes || 0)}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>RSS Memori:</span>
              <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.rssBytes || 0)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Heap Total:</span>
              <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.heapTotalBytes || 0)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>OS Free Mem:</span>
              <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.osFreeBytes || 0)}</span>
            </div>
          </div>
        </div>

        {/* Uptime & Platform Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-xs text-zinc-200">Uptime & Lingkungan</h3>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-semibold">{formatUptime(uptimeSeconds)}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Node Version:</span>
              <span className="font-mono text-zinc-200">{systemInfo?.nodeVersion || process.version}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Platform / Arch:</span>
              <span className="font-mono text-zinc-200">
                {systemInfo?.platform || 'linux'} ({systemInfo?.arch || 'x64'})
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Framework Bot:</span>
              <span className="font-mono text-sky-400">grammY (Long Polling)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold text-sm text-zinc-100 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" /> Aksi Cepat
          </h3>
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('bots')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-zinc-200">Kelola Semua Bot</div>
                  <div className="text-[11px] text-zinc-500">Mulai, hentikan, atau ubah konfigurasi bot</div>
                </div>
              </div>
              <span className="text-xs text-zinc-500">→</span>
            </button>

            <button
              onClick={() => onNavigateTab('logs')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-zinc-200">Buka Live Streaming Log</div>
                  <div className="text-[11px] text-zinc-500">Pantau pesan dan update real-time</div>
                </div>
              </div>
              <span className="text-xs text-zinc-500">→</span>
            </button>

            <button
              onClick={() => onNavigateTab('system')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-zinc-200">Diagnosa & Backup Database</div>
                  <div className="text-[11px] text-zinc-500">Buat snapshot aman SQLite secara konsisten</div>
                </div>
              </div>
              <span className="text-xs text-zinc-500">→</span>
            </button>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
              <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                Aktivitas & Log Terbaru
              </h3>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                Lihat Semua Log →
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">
                Belum ada aktivitas baru. Aktivitas update bot dan event supervisor akan muncul di sini secara real-time.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recentLogs.slice(-6).reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            entry.level === 'ERROR'
                              ? 'bg-rose-500/20 text-rose-300'
                              : entry.level === 'WARN'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {entry.level}
                        </span>
                        <span className="font-mono text-zinc-400 text-[11px] truncate">[{entry.event}]</span>
                      </div>
                      <p className="text-zinc-200 mt-1 truncate text-xs">{entry.message}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
