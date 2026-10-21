import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BotItem } from '../types.js';
import { BotCard } from '../components/BotCard.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { Plus, Search, Filter, Bot, Sparkles, RefreshCw } from 'lucide-react';

interface Props {
  bots: BotItem[];
  onStartBot: (id: string) => Promise<void>;
  onStopBot: (id: string) => Promise<void>;
  onRestartBot: (id: string) => Promise<void>;
  onDeleteBot: (id: string) => Promise<void>;
  onValidateToken: (id: string) => Promise<void>;
  onOpenSettings: (bot: BotItem) => void;
  onOpenLogs: (bot: BotItem) => void;
  onAddBotClick: () => void;
  onRefresh: () => void;
}

export function BotsPage({
  bots,
  onStartBot,
  onStopBot,
  onRestartBot,
  onDeleteBot,
  onValidateToken,
  onOpenSettings,
  onOpenLogs,
  onAddBotClick,
  onRefresh,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [botToDelete, setBotToDelete] = useState<BotItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredBots = bots.filter((bot) => {
    const matchesSearch =
      bot.name.toLowerCase().includes(search.toLowerCase()) ||
      bot.username.toLowerCase().includes(search.toLowerCase()) ||
      bot.telegramBotId.includes(search);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'RUNNING' && bot.status === 'RUNNING') ||
      (statusFilter === 'STOPPED' && bot.status === 'STOPPED') ||
      (statusFilter === 'ERROR' && bot.status === 'ERROR');

    return matchesSearch && matchesStatus;
  });

  const confirmDelete = async () => {
    if (!botToDelete) return;
    setDeleting(true);
    try {
      await onDeleteBot(botToDelete.id);
      setBotToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20 mb-2">
              <Bot className="w-3.5 h-3.5" />
              <span>Multi-Bot Fleet Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Daftar Bot Telegram
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Pantau status polling aktif, operasikan tombol lifecycle, dan atur sambutan untuk setiap bot.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onRefresh}
              title="Refresh Status"
              className="p-3 glass-card rounded-2xl text-zinc-300 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onAddBotClick}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs shadow-xl shadow-sky-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bot Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau @username bot..."
            className="w-full glass-input pl-9 pr-3.5 py-2.5 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 glass-panel p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-400 ml-2 mr-1 hidden sm:inline" />
          {['ALL', 'RUNNING', 'STOPPED', 'ERROR'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-sky-500/20 text-white border border-sky-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {status === 'ALL'
                ? `Semua (${bots.length})`
                : status === 'RUNNING'
                ? `Aktif (${bots.filter((b) => b.status === 'RUNNING').length})`
                : status === 'STOPPED'
                ? `Berhenti (${bots.filter((b) => b.status === 'STOPPED').length})`
                : `Error (${bots.filter((b) => b.status === 'ERROR').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Bot Grid / Empty State */}
      {filteredBots.length === 0 ? (
        <div className="py-20 text-center rounded-3xl glass-panel p-8">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 mx-auto flex items-center justify-center mb-4">
            <Bot className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">
            {bots.length === 0 ? 'Belum Ada Bot yang Didaftarkan' : 'Tidak Ada Bot Sesuai Kriteria'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-6">
            {bots.length === 0
              ? 'Dapatkan token dari @BotFather di Telegram dan daftarkan di sini untuk mulai menjalankan bot secara mandiri.'
              : 'Coba ubah kata kunci pencarian atau ganti filter status di atas.'}
          </p>
          {bots.length === 0 && (
            <button
              onClick={onAddBotClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xl shadow-sky-600/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tambah Bot Pertama Anda</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredBots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                onStart={onStartBot}
                onStop={onStopBot}
                onRestart={onRestartBot}
                onOpenSettings={onOpenSettings}
                onOpenLogs={onOpenLogs}
                onDelete={(b) => setBotToDelete(b)}
                onValidateToken={onValidateToken}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={botToDelete !== null}
        title={`Hapus Bot "${botToDelete?.name}"?`}
        message={`Tindakan ini akan menghentikan proses polling bot (@${botToDelete?.username}) dan menghapus seluruh konfigurasi serta riwayat log dari database SQLite. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Bot"
        cancelLabel="Batal"
        isDestructive={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setBotToDelete(null)}
      />
    </div>
  );
}
