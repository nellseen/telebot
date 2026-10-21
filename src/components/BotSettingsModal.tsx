import React, { useState } from 'react';
import { api } from '../services/api.js';
import { BotItem, BotConfig } from '../types.js';
import { X, Check, Loader2, Settings, MessageSquare, ShieldCheck, PlayCircle } from 'lucide-react';

interface Props {
  bot: BotItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedBot: BotItem) => void;
}

export function BotSettingsModal({ bot, isOpen, onClose, onUpdated }: Props) {
  const [name, setName] = useState(bot.name);
  const [autoStart, setAutoStart] = useState(bot.autoStart);

  const initialConfig = bot.config || {
    welcomeEnabled: true,
    welcomeMessage: 'Halo! Selamat datang di bot ini. Gunakan /help untuk melihat menu bantuan.',
    helpEnabled: true,
    inlineMenuEnabled: true,
    rateLimitEnabled: true,
  };

  const [welcomeEnabled, setWelcomeEnabled] = useState(initialConfig.welcomeEnabled);
  const [welcomeMessage, setWelcomeMessage] = useState(initialConfig.welcomeMessage);
  const [helpEnabled, setHelpEnabled] = useState(initialConfig.helpEnabled);
  const [inlineMenuEnabled, setInlineMenuEnabled] = useState(initialConfig.inlineMenuEnabled);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(initialConfig.rateLimitEnabled);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // 1. Update bot metadata
      const botRes = await api.updateBot(bot.id, {
        name: name.trim(),
        autoStart,
      });

      // 2. Update bot configuration
      const configRes = await api.updateBotConfig(bot.id, {
        welcomeEnabled,
        welcomeMessage,
        helpEnabled,
        inlineMenuEnabled,
        rateLimitEnabled,
      });

      onUpdated({
        ...botRes.bot,
        config: configRes.config as BotConfig,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-base">Pengaturan: {bot.name}</h3>
              <p className="text-xs text-zinc-400">@{bot.username} (ID: {bot.telegramBotId})</p>
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
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Section: General */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Umum & Runtime
            </h4>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Bot</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium">Auto-Start Bot</span>
                  <p className="text-[11px] text-zinc-500">Mulai bot otomatis saat aplikasi atau Termux dinyalakan</p>
                </div>
              </label>
            </div>
          </div>

          {/* Section: Messages */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Pesan & Sambutan
            </h4>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={welcomeEnabled}
                  onChange={(e) => setWelcomeEnabled(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium">Aktifkan Pesan Sambutan (/start)</span>
                  <p className="text-[11px] text-zinc-500">Kirim pesan pembuka saat pengguna memulai bot</p>
                </div>
              </label>
            </div>

            {welcomeEnabled && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Isi Pesan Sambutan (HTML format didukung)</label>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          {/* Section: Commands & Features */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5" /> Fitur & Menu
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={helpEnabled}
                  onChange={(e) => setHelpEnabled(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium">Perintah /help</span>
                  <p className="text-[11px] text-zinc-500">Daftar bantuan perintah</p>
                </div>
              </label>

              <label className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inlineMenuEnabled}
                  onChange={(e) => setInlineMenuEnabled(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium">Menu Inline Keyboard</span>
                  <p className="text-[11px] text-zinc-500">Tombol interaktif /menu</p>
                </div>
              </label>
            </div>
          </div>

          {/* Section: Security */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Keamanan & Perlindungan
            </h4>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rateLimitEnabled}
                  onChange={(e) => setRateLimitEnabled(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium">Rate Limiting Perlindungan Spam</span>
                  <p className="text-[11px] text-zinc-500">Batasi pesan cepat pengguna per 10 detik agar bot tidak kelebihan beban</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl transition-colors shadow-lg shadow-sky-600/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Simpan Pengaturan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
