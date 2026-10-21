import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BotItem, BotLogItem } from '../types.js';
import { api } from '../services/api.js';
import {
  FileText,
  Search,
  Radio,
  Trash2,
  ArrowDown,
  RefreshCw,
  Clock,
  Shield,
  Loader2,
  Terminal,
} from 'lucide-react';

interface Props {
  bots: BotItem[];
  selectedBotId?: string;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
}

export function LogsPage({ bots, selectedBotId: initialBotId, wsStatus }: Props) {
  const [selectedBotId, setSelectedBotId] = useState<string>(initialBotId || 'ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<BotLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (selectedBotId !== 'ALL') {
        const res = await api.getBotLogs(selectedBotId, {
          level: levelFilter !== 'ALL' ? levelFilter : undefined,
          q: search || undefined,
          limit: 250,
        });
        setLogs(res.logs || []);
      } else {
        if (bots.length > 0) {
          const res = await api.getBotLogs(bots[0].id, {
            level: levelFilter !== 'ALL' ? levelFilter : undefined,
            q: search || undefined,
            limit: 250,
          });
          setLogs(res.logs || []);
        } else {
          setLogs([]);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedBotId, levelFilter]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleClearLogs = async () => {
    if (selectedBotId === 'ALL') return;
    setClearing(true);
    try {
      await api.clearBotLogs(selectedBotId);
      setLogs([]);
    } finally {
      setClearing(false);
    }
  };

  const filteredLogs = logs.filter((item) => {
    if (levelFilter !== 'ALL' && item.level !== levelFilter) return false;
    if (
      search &&
      !item.message.toLowerCase().includes(search.toLowerCase()) &&
      !item.event.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20 mb-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>Real-Time WebSocket Streaming</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Live Telemetri & Log Update Bot
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Pantau jalannya update Telegram, waktu pemrosesan, dan error boundary secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-card text-xs">
              <Radio
                className={`w-3.5 h-3.5 ${
                  wsStatus === 'connected'
                    ? 'text-emerald-400 animate-pulse'
                    : wsStatus === 'connecting'
                    ? 'text-amber-400 animate-spin'
                    : 'text-rose-400'
                }`}
              />
              <span className="font-semibold text-white">
                {wsStatus === 'connected' ? 'WebSocket Online' : wsStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
              </span>
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              title="Refresh Log"
              className="p-3 glass-card rounded-2xl text-zinc-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Bot selector, level selector, search, clear */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bot Select */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Pilih Target Bot</label>
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs text-white focus:outline-none"
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id} className="bg-zinc-950 text-white">
                  {b.name} (@{b.username})
                </option>
              ))}
              {bots.length === 0 && <option value="NONE" className="bg-zinc-950 text-white">Belum ada bot</option>}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Filter Level Log</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs text-white focus:outline-none"
            >
              <option value="ALL" className="bg-zinc-950 text-white">Semua Level (INFO, WARN, ERROR)</option>
              <option value="INFO" className="bg-zinc-950 text-white">INFO (Update Sukses)</option>
              <option value="WARN" className="bg-zinc-950 text-white">WARN (Peringatan & Rate Limit)</option>
              <option value="ERROR" className="bg-zinc-950 text-white">ERROR (Fatal & Konflik)</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Pencarian Keyword</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari teks pesan, event..."
                className="w-full glass-input pl-9 pr-3.5 py-2.5 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-950 border-white/20 text-sky-500"
              />
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <ArrowDown className="w-3.5 h-3.5 text-sky-400" /> Auto-scroll ke pesan terbaru
              </span>
            </label>
            <span className="text-white/20">|</span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {filteredLogs.length} entri tercatat
            </span>
          </div>

          {selectedBotId !== 'ALL' && (
            <button
              onClick={handleClearLogs}
              disabled={clearing || logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 text-xs font-medium border border-white/[0.06] transition-colors disabled:opacity-40"
            >
              {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Bersihkan Log Bot</span>
            </button>
          )}
        </div>
      </div>

      {/* Liquid Terminal View */}
      <div className="glass-panel p-5 rounded-3xl font-mono text-xs overflow-hidden shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-semibold text-zinc-300">live-stream.log</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>Kredensial disanitasi otomatis</span>
          </div>
        </div>

        <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-zinc-500">
              Tidak ada log yang cocok. Mulai bot atau kirim pesan di Telegram untuk melihat log streaming realtime.
            </div>
          ) : (
            filteredLogs.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 py-1.5 px-2.5 rounded-xl hover:bg-white/[0.04] transition-colors leading-relaxed"
              >
                <span className="text-zinc-500 text-[10px] shrink-0 flex items-center gap-1 pt-0.5 font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(item.createdAt).toLocaleTimeString()}
                </span>

                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    item.level === 'ERROR'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : item.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/[0.08] text-sky-300 border border-white/[0.06]'
                  }`}
                >
                  {item.level}
                </span>

                <span className="text-zinc-300 shrink-0 text-[11px] font-semibold">[{item.event}]</span>

                <span
                  className={`break-all ${
                    item.level === 'ERROR'
                      ? 'text-rose-300'
                      : item.level === 'WARN'
                      ? 'text-amber-200'
                      : 'text-zinc-200'
                  }`}
                >
                  {item.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
