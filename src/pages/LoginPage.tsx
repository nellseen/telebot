import React, { useState } from 'react';
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
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-7 z-10">
        {/* Brand Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 items-center justify-center shadow-xl shadow-sky-500/25 mb-4 text-white">
            <Send className="w-7 h-7 -rotate-12" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Telegram Bot Manager</h1>
          <p className="text-xs text-zinc-400 mt-1">Multi-Bot Runtime, SQLite & GrammY Engine</p>

          {isTermux && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Terminal className="w-3.5 h-3.5" />
              <span>Android Termux Environment Detected</span>
            </div>
          )}
        </div>

        {/* Form Mode Title */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            {isBootstrap ? (
              <>
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Inisialisasi Akun Administrator Pertama</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Login Administrator</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {isBootstrap
              ? 'Belum ada akun di sistem. Buat username dan password kuat untuk mengamankan dashboard.'
              : 'Masukkan kredensial Anda untuk mengakses panel kontrol dan manajemen bot.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
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
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
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
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || password.length < 6}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-sky-600/25"
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
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500 leading-relaxed">
          <span>Keamanan Terjamin: Sandi di-hash menggunakan PBKDF2 (100k iterasi), token dienkripsi dengan AES-256-GCM.</span>
        </div>
      </div>
    </div>
  );
}
