import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-base">Tambah Bot Telegram Baru</h3>
              <p className="text-xs text-zinc-400">Hubungkan bot Telegram Anda menggunakan token BotFather</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Nama Bot (Pengenal di Dashboard) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Bot Layanan Pelanggan"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>
                Token Telegram Bot API <span className="text-rose-400">*</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-normal">Dari @BotFather</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              />
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              🔒 Token akan dienkripsi dengan <b>AES-256-GCM</b> dan tidak pernah dibagikan atau dicatat dalam log.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-sky-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Jalankan bot secara otomatis setelah ditambahkan dan saat restart server</span>
            </label>
          </div>

          {/* Info callout */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Fitur template bawaan otomatis:
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Perintah bawaan <code>/start</code>, <code>/help</code>, <code>/id</code>, <code>/ping</code>, <code>/about</code>, dan <code>/menu</code> interaktif akan langsung aktif tanpa perlu coding ulang!
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !token.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-sky-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi Token & Mendaftarkan...
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
      </div>
    </div>
  );
}
