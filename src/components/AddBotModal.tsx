import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api.js';
import { BotItem } from '../types.js';
import { X, CheckCircle2, AlertCircle, Loader2, Bot, KeyRound, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bot: BotItem) => void;
}

export function AddBotModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [autoStart, setAutoStart] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createBot({
        name: name.trim(),
        token: token.trim(),
        autoStart,
      });

      setName('');
      setToken('');
      onSuccess(res.bot);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg glass-panel-elevated rounded-3xl p-6 sm:p-7 overflow-hidden shadow-2xl border border-white/[0.12]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Tambah Bot Telegram Baru</h3>
                <p className="text-xs text-zinc-400">Daftarkan token bot yang didapatkan dari @BotFather</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-200 mb-1.5">
                Nama Bot (Pengenal di Dashboard) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bot Layanan Pelanggan"
                className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-200 mb-1.5 flex items-center justify-between">
                <span>
                  Token Telegram Bot API <span className="text-rose-400">*</span>
                </span>
                <span className="text-[11px] text-sky-400 font-mono">Dapatkan dari @BotFather</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                  className="w-full glass-input pl-10 pr-4 py-2.5 rounded-2xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none"
                />
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-400">
                🔒 Token akan dienkripsi secara aman dengan <b>AES-256-GCM</b> dan tidak pernah terekspos dalam log.
              </p>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-white/20 text-sky-500 focus:ring-0"
                />
                <span>Mulai bot otomatis setelah ditambahkan dan saat restart server</span>
              </label>
            </div>

            {/* Template Features Callout */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Template Otomatis Bawaan:
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Perintah <code>/start</code>, <code>/help</code>, <code>/id</code>, <code>/ping</code>, <code>/about</code>, dan <code>/menu</code> interaktif akan langsung aktif pada bot ini.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || !token.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all shadow-xl shadow-sky-600/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi & Mendaftarkan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verifikasi & Tambah Bot
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
