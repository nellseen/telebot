import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BotItem, SystemInfo, LogEntry } from '../types.js';
import { NavTab } from '../components/Sidebar.js';
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
  Sparkles,
  Command,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface Props {
  bots: BotItem[];
  systemInfo: SystemInfo | null;
  recentLogs: LogEntry[];
  onAddBotClick: () => void;
  onNavigateTab: (tab: NavTab) => void;
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
      {/* Liquid Glass Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 text-xs font-semibold border border-sky-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Liquid Glass Multi-Bot Hub</span>
              </span>
              {systemInfo?.isTermux && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <Terminal className="w-3.5 h-3.5" /> Android Termux Active
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Pusat Kendali Telegram Bot
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300/90 leading-relaxed">
              Pantau status runtime grammY, konfigurasi template interaktif, telemetri log streaming, dan penyimpanan SQLite lokal persisten dalam satu dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRefresh}
              title="Refresh Metrik"
              className="p-3 glass-card rounded-2xl text-zinc-300 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onAddBotClick}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs shadow-xl shadow-sky-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Bot Baru</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bots */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          onClick={() => onNavigateTab('bots')}
          className="glass-card p-5 rounded-3xl cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Total Bot</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-white tracking-tight">{totalBots}</div>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 group-hover:text-sky-300 transition-colors">
              <span>Buka daftar bot</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </motion.div>

        {/* Active Bots */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          onClick={() => onNavigateTab('bots')}
          className="glass-card p-5 rounded-3xl cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Bot Online</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">{activeBots}</div>
            <p className="text-[11px] text-zinc-400 mt-1">Polling Telegram aktif</p>
          </div>
        </motion.div>

        {/* Stopped Bots */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          onClick={() => onNavigateTab('bots')}
          className="glass-card p-5 rounded-3xl cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Bot Berhenti</span>
            <div className="w-9 h-9 rounded-2xl bg-zinc-800 text-zinc-400 border border-white/[0.06] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Square className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-zinc-300 tracking-tight">{stoppedBots}</div>
            <p className="text-[11px] text-zinc-400 mt-1">Status offline</p>
          </div>
        </motion.div>

        {/* Error Bots */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          onClick={() => onNavigateTab('bots')}
          className="glass-card p-5 rounded-3xl cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Error Runtime</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-bold font-mono tracking-tight ${errorBots > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
              {errorBots}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {errorBots > 0 ? 'Perlu tindakan' : 'Semua worker nominal'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Resource & Storage Glass Strips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* SQLite Database Widget */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          onClick={() => onNavigateTab('database')}
          className="glass-panel p-5 rounded-3xl cursor-pointer group hover:border-emerald-500/30 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-xs text-white">Database SQLite</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>File Path:</span>
                <span className="font-mono text-zinc-200">data/app.db</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Ukuran:</span>
                <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.database?.sizeBytes || 0)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tabel Skema:</span>
                <span className="font-mono text-zinc-200">{systemInfo?.database?.tablesCount || 6} tabel</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Buka manajemen database</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Process Memory Widget */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          onClick={() => onNavigateTab('system')}
          className="glass-panel p-5 rounded-3xl cursor-pointer group hover:border-indigo-500/30 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-xs text-white">Memori Node.js</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                RSS: {formatBytes(systemInfo?.memory?.rssBytes || 0)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Heap Terpakai:</span>
                <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.heapUsedBytes || 0)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Heap Total:</span>
                <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.heapTotalBytes || 0)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>OS Free Memory:</span>
                <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.osFreeBytes || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">
            <span>Lihat diagnosa performa</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Uptime & Platform Widget */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          onClick={() => onNavigateTab('system')}
          className="glass-panel p-5 rounded-3xl cursor-pointer group hover:border-sky-500/30 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-xs text-white">Uptime Aplikasi</h3>
              </div>
              <span className="font-mono text-xs text-sky-400 font-bold">{formatUptime(uptimeSeconds)}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Platform OS:</span>
                <span className="font-mono text-zinc-200">
                  {systemInfo?.platform || 'linux'} ({systemInfo?.arch || 'x64'})
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Node Version:</span>
                <span className="font-mono text-zinc-200">{systemInfo?.nodeVersion || process.version}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Supervisor Engine:</span>
                <span className="font-mono text-sky-400">grammY Long Polling</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-sky-400 group-hover:translate-x-1 transition-transform">
            <span>Buka panduan Termux</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>
      </div>

      {/* Feature Showcase Navigation & Realtime Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Navigation Cards (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" /> Akses Fitur Langsung
            </h3>
            <span className="text-[11px] text-zinc-400">Navigasi Cepat</span>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('bots')}
              className="w-full glass-card p-3.5 rounded-2xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                    Daftar & Kontrol Bot
                  </div>
                  <div className="text-[11px] text-zinc-400">Jalankan, hentikan, restart, atau ubah konfigurasi</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('templates')}
              className="w-full glass-card p-3.5 rounded-2xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Command className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Template & Simulator
                  </div>
                  <div className="text-[11px] text-zinc-400">Uji perintah /start, /ping, /menu di chat simulator</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('logs')}
              className="w-full glass-card p-3.5 rounded-2xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    Live Telemetri Log
                  </div>
                  <div className="text-[11px] text-zinc-400">Streaming real-time update masuk & error tracking</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('database')}
              className="w-full glass-card p-3.5 rounded-2xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    Snapshot & Backup SQLite
                  </div>
                  <div className="text-[11px] text-zinc-400">Buat snapshot database non-blocking (VACUUM INTO)</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('security')}
              className="w-full glass-card p-3.5 rounded-2xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                    Keamanan & Kunci Enkripsi
                  </div>
                  <div className="text-[11px] text-zinc-400">Parameter enkripsi token AES-256-GCM & PBKDF2</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        {/* Live Activity Stream (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                Aktivitas & Telemetri Real-time
              </h3>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
              >
                <span>Buka Console Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500">
                Belum ada aktivitas baru. Saat bot Telegram Anda menerima pesan atau supervisor bot mengubah status, aktivitas akan muncul di sini secara real-time.
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {recentLogs.slice(-7).reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl glass-card flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            entry.level === 'ERROR'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : entry.level === 'WARN'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/[0.08] text-sky-300 border border-white/[0.06]'
                          }`}
                        >
                          {entry.level}
                        </span>
                        <span className="font-mono text-zinc-400 text-[11px] truncate">
                          [{entry.event}]
                        </span>
                      </div>
                      <p className="text-zinc-200 mt-1.5 truncate text-xs font-mono">{entry.message}</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
            <span>Mode Streaming: WebSocket path <code>/ws</code></span>
            <span className="text-emerald-400 font-mono">Auto-Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
