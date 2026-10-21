import { useState, useEffect } from 'react';
import { SystemInfo, AuditLogItem } from '../types.js';
import { api } from '../services/api.js';
import {
  Terminal,
  Cpu,
  Clock,
  Shield,
  RefreshCw,
  Info,
  CheckCircle2,
  Server,
  Zap,
} from 'lucide-react';

interface Props {
  systemInfo: SystemInfo | null;
  onRefresh: () => void;
}

export function SystemPage({ systemInfo, onRefresh }: Props) {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setAuditLogs(res.auditLogs || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>Runtime Health & Android Termux Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Diagnosa Sistem & Jejak Audit
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Panduan wakelock Android, performa memori Node.js, dan riwayat audit tindakan administratif.
            </p>
          </div>

          <button
            onClick={() => {
              onRefresh();
              loadData();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 glass-card text-zinc-300 hover:text-white text-xs font-semibold rounded-2xl transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnosa</span>
          </button>
        </div>
      </div>

      {/* Termux Android Guidance Box */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Panduan Kompatibilitas Android & Termux</h3>
              <p className="text-xs text-zinc-400">Pencegahan pembekuan proses background oleh OS Android</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {systemInfo?.isTermux ? 'Android Termux Aktif' : 'Termux-Ready'}
          </span>
        </div>

        <div className="text-xs text-zinc-300 space-y-3 leading-relaxed glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Langkah Menjaga Bot Tetap Online di Android:</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-xs pl-1">
            <li>
              <b>Termux Wake Lock:</b> Jalankan perintah <code className="text-emerald-400 font-mono">termux-wake-lock</code> di terminal Termux sebelum menjalankan server agar CPU tidak masuk ke mode deep sleep.
            </li>
            <li>
              <b>Bebaskan Optimasi Baterai:</b> Buka Pengaturan Android → Aplikasi → Termux → Baterai → Pilih <b>Tidak Dibatasi (Unrestricted)</b>.
            </li>
            <li>
              <b>Kunci di Recent Apps:</b> Tekan ikon gembok pada aplikasi Termux di layar recent apps agar tidak terhapus saat tombol <i>Clear All</i> ditekan.
            </li>
          </ul>
        </div>
      </div>

      {/* Process & System Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-xs text-white">Platform & Arsitektur</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Node {systemInfo?.nodeVersion || process.version}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Platform OS:</span>
              <span className="font-mono text-zinc-200">{systemInfo?.platform || process.platform}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Arsitektur CPU:</span>
              <span className="font-mono text-zinc-200">{systemInfo?.arch || process.arch}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Prefix Termux:</span>
              <span className="font-mono text-zinc-200 truncate max-w-[140px]">{systemInfo?.termuxPrefix || '-'}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-xs text-white">Konsumsi Memori</h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-400">RSS {formatBytes(systemInfo?.memory?.rssBytes || 0)}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Heap Terpakai:</span>
              <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.heapUsedBytes || 0)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Total Alokasi Heap:</span>
              <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.heapTotalBytes || 0)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>RAM Bebas Sistem:</span>
              <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.memory?.osFreeBytes || 0)}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-xs text-white">Siklus Hidup Server</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Aktif</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Mode Server:</span>
              <span className="font-mono text-zinc-200">Express + Vite Fullstack</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>WebSocket Port:</span>
              <span className="font-mono text-sky-400">3000 (/ws)</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Graceful Shutdown:</span>
              <span className="text-emerald-400 font-semibold">SIGINT / SIGTERM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">Jejak Audit Administratif</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{auditLogs.length} aksi tercatat</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Belum ada jejak audit yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3.5">Waktu</th>
                  <th className="py-3 px-3.5">Aksi</th>
                  <th className="py-3 px-3.5">Tipe Resource</th>
                  <th className="py-3 px-3.5">ID Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3.5 text-zinc-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-sky-400 font-bold">{log.action}</td>
                    <td className="py-2.5 px-3.5 text-zinc-300">{log.resourceType}</td>
                    <td className="py-2.5 px-3.5 text-zinc-400 text-[11px] truncate max-w-xs">{log.resourceId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
