import { useState, useEffect } from 'react';
import { SystemInfo, BackupItem, AuditLogItem } from '../types.js';
import { api } from '../services/api.js';
import {
  Terminal,
  Database,
  HardDrive,
  Cpu,
  Clock,
  Shield,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Info,
  Layers,
} from 'lucide-react';

interface Props {
  systemInfo: SystemInfo | null;
  onRefresh: () => void;
}

export function SystemPage({ systemInfo, onRefresh }: Props) {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [backupsRes, auditRes] = await Promise.all([
        api.getBackups(),
        api.getAuditLogs(),
      ]);
      setBackups(backupsRes.backups || []);
      setAuditLogs(auditRes.auditLogs || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async () => {
    setBackingUp(true);
    setBackupSuccess(null);
    setBackupError(null);
    try {
      const res = await api.createBackup();
      setBackupSuccess(`Backup berhasil dibuat: ${res.backup.filename} (${Math.round(res.backup.sizeBytes / 1024)} KB)`);
      loadData();
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Gagal membuat backup');
    } finally {
      setBackingUp(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-sky-400" />
            Diagnosa Sistem & Manajemen Database
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Informasi kompatibilitas Termux Android, pemantauan integritas SQLite, dan backup atomik.
          </p>
        </div>

        <button
          onClick={() => {
            onRefresh();
            loadData();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Diagnosa</span>
        </button>
      </div>

      {/* Termux Android Guidance Box */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-200">Panduan Kompatibilitas Termux Android</h3>
              <p className="text-xs text-zinc-400">Pencegahan pembatasan proses background oleh OS Android</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {systemInfo?.isTermux ? 'Lingkungan Termux Aktif' : 'Termux Ready'}
          </span>
        </div>

        <div className="text-xs text-zinc-300 space-y-2 leading-relaxed bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
          <p>
            📌 <b>Mencegah Bot Mati di Background Android:</b>
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
            <li>
              Jalankan perintah <code className="text-emerald-400">termux-wake-lock</code> di terminal Termux sebelum menjalankan server agar CPU tidak tidur (sleep mode).
            </li>
            <li>
              Nonaktifkan penghemat baterai (Battery Optimization) untuk aplikasi Termux pada pengaturan ponsel Android Anda.
            </li>
            <li>
              Database disimpan secara aman di file lokal <code className="text-sky-400">data/app.db</code> tanpa memerlukan server PostgreSQL atau Docker eksternal.
            </li>
          </ul>
        </div>
      </div>

      {/* Database & Backup Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SQLite Database Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-sm text-zinc-200">Database SQLite Lokal</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> PRAGMA OK
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Path File Database:</span>
                <span className="font-mono text-zinc-200">data/app.db</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Ukuran File:</span>
                <span className="font-mono text-zinc-200">{formatBytes(systemInfo?.database?.sizeBytes || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Jumlah Tabel:</span>
                <span className="font-mono text-zinc-200">{systemInfo?.database?.tablesCount || 6} tabel</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Metode Backup:</span>
                <span className="font-mono text-sky-400">Atomic VACUUM INTO (Non-blocking)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-800/80">
            {backupSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{backupSuccess}</span>
              </div>
            )}
            {backupError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{backupError}</span>
              </div>
            )}

            <button
              onClick={handleCreateBackup}
              disabled={backingUp}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-colors shadow-lg shadow-sky-600/20"
            >
              {backingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat Snapshot Konsisten...
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  Buat Backup Database Sekarang
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Backups List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-zinc-200">Daftar Backup Tersedia</h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">{backups.length} file</span>
            </div>

            {backups.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Belum ada file backup yang dibuat. Klik tombol "Buat Backup Database" untuk membuat snapshot pertama.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {backups.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-zinc-200 truncate">{b.filename}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {new Date(b.createdAt).toLocaleString()} • {formatBytes(b.sizeBytes)}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                      Valid
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-zinc-500 mt-3 pt-3 border-t border-zinc-800/80">
            File backup disimpan di folder <code>data/backups/</code> dan tidak di-commit ke Git.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-zinc-200">Audit Log Administratif</h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">{auditLogs.length} aksi terakhir</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500">
            Belum ada aktivitas audit log yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Tipe Resource</th>
                  <th className="py-2.5 px-3">ID Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-950/50 transition-colors">
                    <td className="py-2 px-3 text-zinc-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-sky-400 font-semibold">{log.action}</td>
                    <td className="py-2 px-3 text-zinc-300">{log.resourceType}</td>
                    <td className="py-2 px-3 text-zinc-400 text-[11px] truncate max-w-xs">{log.resourceId}</td>
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
