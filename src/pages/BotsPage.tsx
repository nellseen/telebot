import { useState } from 'react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-400" />
            Manajemen Bot Telegram
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola status runtime, konfigurasi pesan, auto-start, dan template untuk setiap bot.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            title="Refresh Status"
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-colors border border-zinc-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onAddBotClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-lg shadow-sky-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bot</span>
          </button>
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
            placeholder="Cari berdasarkan nama, username..."
            className="w-full pl-9 pr-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-500 ml-2 mr-1 hidden sm:inline" />
          {['ALL', 'RUNNING', 'STOPPED', 'ERROR'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
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
        <div className="py-16 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center mb-3">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">
            {bots.length === 0 ? 'Belum Ada Bot Terdaftar' : 'Tidak Ada Bot yang Sesuai Filter'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-5">
            {bots.length === 0
              ? 'Tambahkan bot Telegram pertama Anda dengan token dari @BotFather untuk mulai menjalankan template otomatis.'
              : 'Coba ubah kata kunci pencarian atau ganti filter status.'}
          </p>
          {bots.length === 0 && (
            <button
              onClick={onAddBotClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-lg shadow-sky-600/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Daftarkan Bot Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={botToDelete !== null}
        title={`Hapus Bot "${botToDelete?.name}"?`}
        message={`Tindakan ini akan menghentikan bot (@${botToDelete?.username}) jika sedang berjalan dan menghapus seluruh konfigurasi serta riwayat log dari database SQLite. Tindakan ini tidak dapat dibatalkan.`}
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
