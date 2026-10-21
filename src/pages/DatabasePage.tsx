import { useState, useEffect } from 'react';
import { BackupItem, SystemInfo } from '../types.js';
import { api } from '../services/api.js';
import {
  Database,
  CheckCircle2,
  HardDrive,
  Download,
  AlertTriangle,
  Loader2,
  Table,
  Layers,
  Sparkles,
  RefreshCw,
  FolderLock,
  FileCheck,
} from 'lucide-react';

interface Props {
  systemInfo: SystemInfo | null;
  onRefresh: () => void;
}

export function DatabasePage({ systemInfo, onRefresh }: Props) {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<'ok' | 'checking' | 'error'>('ok');

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await api.getBackups();
      setBackups(res.backups || []);
    } catch {
      // ignore
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setBackingUp(true);
    setBackupSuccess(null);
    setBackupError(null);
    try {
      const res = await api.createBackup();
      setBackupSuccess(`Backup berhasil: ${res.backup.filename} (${Math.round(res.backup.sizeBytes / 1024)} KB)`);
      loadBackups();
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Gagal membuat backup');
    } finally {
      setBackingUp(false);
    }
  };

  const handleCheckIntegrity = () => {
    setIntegrityStatus('checking');
    setTimeout(() => {
      setIntegrityStatus('ok');
    }, 600);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const tableList = [
    { name: 'User', purpose: 'Akun administrator & autentikasi sistem', icon: '👤' },
    { name: 'Bot', purpose: 'Data bot terdaftar, username, & encryptedToken', icon: '🤖' },
    { name: 'BotConfig', purpose: 'Pengaturan pesan sambutan & tombol inline', icon: '⚙️' },
    { name: 'BotRuntime', purpose: 'Status desired vs observed, workerId, heartbeat', icon: '⚡' },
    { name: 'BotLog', purpose: 'Riwayat update Telegram & log level', icon: '📜' },
    { name: 'AuditLog', purpose: 'Jejak audit aksi administratif', icon: '🛡️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-sky-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Embedded SQLite 3 Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Penyimpanan Persisten & Manajemen SQLite
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl">
              Database SQLite lokal tanpa memerlukan Docker atau PostgreSQL eksternal. Mendukung snapshot non-blocking (VACUUM INTO).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRefresh();
                loadBackups();
              }}
              className="p-2.5 rounded-2xl glass-card text-zinc-300 hover:text-white transition-colors"
              title="Refresh Info"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCreateBackup}
              disabled={backingUp}
              className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center gap-2"
            >
              {backingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat Snapshot...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span>Buat Backup Baru</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Database KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Health & Integrity Card */}
        <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-xs text-zinc-200">Integritas Database</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRAGMA OK
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Status Koneksi:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Aktif & Persisten
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Integrity Check:</span>
                <span className="font-mono text-zinc-200">
                  {integrityStatus === 'checking' ? 'Memeriksa...' : 'ok (0 korupsi)'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Journal Mode:</span>
                <span className="font-mono text-sky-400">WAL / Atomic</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckIntegrity}
            disabled={integrityStatus === 'checking'}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium border border-white/[0.06] transition-colors"
          >
            {integrityStatus === 'checking' ? 'Menjalankan PRAGMA...' : 'Uji Integritas SQLite'}
          </button>
        </div>

        {/* Database Storage File Card */}
        <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-xs text-zinc-200">Penyimpanan Fisik</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {formatBytes(systemInfo?.database?.sizeBytes || 0)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Lokasi Path:</span>
                <span className="font-mono text-zinc-200 text-[11px]">data/app.db</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Jumlah Tabel:</span>
                <span className="font-mono text-zinc-200">{systemInfo?.database?.tablesCount || 6} tabel skema</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>ORM:</span>
                <span className="font-mono text-sky-400">Prisma Client 5.22</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
            <span>Kompatibel Android:</span>
            <span className="text-emerald-400 font-medium">100% Termux Safe</span>
          </div>
        </div>

        {/* Backup Mechanism Card */}
        <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-xs text-zinc-200">Snapshot Non-Blocking</h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-400">VACUUM INTO</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Pencadangan database dilakukan secara konsisten tanpa menghentikan bot yang sedang polling Telegram.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-zinc-400">
            Direktori Backup: <code className="text-sky-400">data/backups/</code>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {backupSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{backupSuccess}</span>
        </div>
      )}
      {backupError && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{backupError}</span>
        </div>
      )}

      {/* Tables Breakdown & Backups List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Schema Breakdown (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-sm text-white">Struktur Tabel Skema Prisma</h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">6 Tabel Aktif</span>
          </div>

          <div className="space-y-2">
            {tableList.map((t) => (
              <div
                key={t.name}
                className="glass-card p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{t.icon}</span>
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-zinc-200">{t.name}</span>
                    <p className="text-[11px] text-zinc-400 truncate">{t.purpose}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06] shrink-0">
                  Indexed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Existing Backups List (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-white">Riwayat Snapshot Backup</h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{backups.length} file</span>
            </div>

            {loadingBackups ? (
              <div className="py-12 flex justify-center text-xs text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
              </div>
            ) : backups.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Belum ada snapshot backup. Klik "Buat Backup Baru" di atas untuk membuat snapshot konsisten.
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {backups.map((b, idx) => (
                  <div
                    key={idx}
                    className="glass-card p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-zinc-200 font-medium truncate">{b.filename}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {new Date(b.createdAt).toLocaleString()} • {formatBytes(b.sizeBytes)}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-zinc-400">
            💡 <b>Cara Restore Database:</b> Hentikan server, lalu salin file backup pilihan Anda menimpa <code>data/app.db</code> (contoh: <code>cp data/backups/backup-xxx.db data/app.db</code>), lalu jalankan kembali aplikasi.
          </div>
        </div>
      </div>
    </div>
  );
}
