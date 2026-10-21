import React, { useState } from 'react';
import { motion } from 'motion/react';
import { api, setClientToken } from '../services/api.js';
import { User } from '../types.js';
import { Send, Shield, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2, Sparkles, Terminal } from 'lucide-react';

interface Props {
  needsBootstrap: boolean;
  onLoginSuccess: (user: User) => void;
  isTermux?: boolean;
}

export function LoginPage({ needsBootstrap: initialNeedsBootstrap, onLoginSuccess, isTermux }: Props) {
  const [isBootstrap, setIsBootstrap] = useState(initialNeedsBootstrap);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isBootstrap) {
        const res = await api.bootstrap({ username, password });
        if (res.sessionId) setClientToken(res.sessionId);
        onLoginSuccess(res.user);
      } else {
        const res = await api.login({ username, password });
        if (res.sessionId) setClientToken(res.sessionId);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Liquid background fluid glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-[120px] animate-blob-1" />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[130px] animate-blob-2" />
        <div className="absolute top-2/3 left-1/3 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[140px] animate-blob-3" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md glass-panel p-8 rounded-3xl z-10 shadow-2xl border border-white/10"
      >
        {/* Brand Logo & Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-3xl blur-md opacity-75"></div>
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl">
              <Send className="w-7 h-7 -rotate-12" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">TeleBot Hub</h1>
          <p className="text-xs text-zinc-400 mt-1">Multi-Bot Runtime, SQLite & GrammY Engine</p>

          {isTermux && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
              <Terminal className="w-3.5 h-3.5" />
              <span>Android Termux Environment</span>
            </div>
          )}
        </div>

        {/* Form Mode Title */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            {isBootstrap ? (
              <>
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Inisialisasi Akun Administrator</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Login Administrator</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
            {isBootstrap
              ? 'Belum ada akun di sistem. Buat username dan sandi untuk mengamankan control panel Anda.'
              : 'Masukkan kredensial Anda untuk mengelola bot, webhook, dan database.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: admin"
                className="w-full pl-9 pr-3.5 py-2.5 glass-input rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3.5 py-2.5 glass-input rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || password.length < 6}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-sky-600/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isBootstrap ? 'Membuat Akun...' : 'Memverifikasi Sesi...'}
              </>
            ) : isBootstrap ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Buat Akun Administrator & Masuk
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Masuk ke Dashboard
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] text-center text-[11px] text-zinc-500 leading-relaxed">
          <span>Keamanan Terjamin: Sandi di-hash PBKDF2 (100k iterasi), token dienkripsi AES-256-GCM.</span>
        </div>
      </motion.div>
    </div>
  );
}
