import { useState, useEffect, useRef } from 'react';
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

  // Fetch logs whenever selectedBotId or levelFilter changes
  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (selectedBotId !== 'ALL') {
        const res = await api.getBotLogs(selectedBotId, {
          level: levelFilter !== 'ALL' ? levelFilter : undefined,
          q: search || undefined,
          limit: 200,
        });
        setLogs(res.logs || []);
      } else {
        // If all bots, fetch system logs or first bot's logs
        if (bots.length > 0) {
          const res = await api.getBotLogs(bots[0].id, {
            level: levelFilter !== 'ALL' ? levelFilter : undefined,
            q: search || undefined,
            limit: 200,
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

  // Auto-scroll when logs change
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
    if (search && !item.message.toLowerCase().includes(search.toLowerCase()) && !item.event.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Live Logs & Telemetri Real-time
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Streaming pemrosesan update telegram, penanganan error, dan aktivitas runtime bot.
          </p>
        </div>

        {/* WebSocket Status Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <Radio
              className={`w-3.5 h-3.5 ${
                wsStatus === 'connected'
                  ? 'text-emerald-400 animate-pulse'
                  : wsStatus === 'connecting'
                  ? 'text-amber-400 animate-spin'
                  : 'text-rose-400'
              }`}
            />
            <span className="font-medium text-zinc-300">
              {wsStatus === 'connected' ? 'WebSocket Aktif' : wsStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
            </span>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            title="Muat ulang log"
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-colors border border-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Bar: Bot selector, level selector, search, clear */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bot Select */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Pilih Bot</label>
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (@{b.username})
                </option>
              ))}
              {bots.length === 0 && <option value="NONE">Tidak ada bot</option>}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Tingkat Level</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Semua Level (INFO, WARN, ERROR)</option>
              <option value="INFO">INFO (Update Sukses)</option>
              <option value="WARN">WARN (Peringatan & Rate Limit)</option>
              <option value="ERROR">ERROR (Fatal & Konflik)</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Cari Pesan Log</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kata kunci..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700 text-sky-500"
              />
              <span className="flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Auto-scroll ke bawah
              </span>
            </label>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 font-mono text-[11px]">
              Menampilkan {filteredLogs.length} baris
            </span>
          </div>

          {selectedBotId !== 'ALL' && (
            <button
              onClick={handleClearLogs}
              disabled={clearing || logs.length === 0}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-400 transition-colors disabled:opacity-40"
            >
              {clearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              <span>Bersihkan Log Bot Ini</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminal / Log Viewer */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-xs overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-zinc-400">telegram-bot-manager.log</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>Kredensial disanitasi otomatis</span>
          </div>
        </div>

        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-zinc-600">
              Tidak ada log yang cocok. Mulai bot atau kirim pesan di Telegram untuk melihat log realtime.
            </div>
          ) : (
            filteredLogs.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 py-1 px-2 rounded-lg hover:bg-zinc-900/60 transition-colors leading-relaxed"
              >
                <span className="text-zinc-600 text-[10px] shrink-0 flex items-center gap-1 pt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(item.createdAt).toLocaleTimeString()}
                </span>

                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    item.level === 'ERROR'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : item.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-zinc-800 text-sky-400 border border-zinc-700'
                  }`}
                >
                  {item.level}
                </span>

                <span className="text-zinc-400 shrink-0 text-[11px] font-semibold">[{item.event}]</span>

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
