import { useState } from 'react';
import { maskToken } from '../utils/token.js';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  FileKey,
  Fingerprint,
} from 'lucide-react';

export function SecurityPage() {
  const [testToken, setTestToken] = useState('7123456789:AAFlm3k_SampleSecretToken1234567890abcdef');
  const [showMasked, setShowMasked] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-sky-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hardened Security Standard</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Keamanan Token & Perlindungan Kriptografi
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl">
              Token bot tidak pernah disimpan dalam bentuk plaintext. Enkripsi otentikasi AES-256-GCM menjaga token tetap aman dari kebocoran data.
            </p>
          </div>
        </div>
      </div>

      {/* Security Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Token Encryption Card */}
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-xs text-zinc-200">Enkripsi Token Bot</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              AES-256-GCM
            </span>
          </div>

          <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
            <p>
              • Menggunakan algoritma <b>AES-256-GCM</b> dengan initialization vector (IV 96-bit) dan authentication tag (128-bit) per token.
            </p>
            <p>
              • Kunci enkripsi diambil dari environment variable <code>ENCRYPTION_KEY</code> (32-byte secret), terpisah dari database.
            </p>
          </div>
        </div>

        {/* Password Hashing Card */}
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-xs text-zinc-200">Hashing Sandi Admin</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              PBKDF2-SHA512
            </span>
          </div>

          <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
            <p>
              • Dihash menggunakan <b>PBKDF2</b> dengan 100.000 iterasi dan random salt 16-byte kriptografis.
            </p>
            <p>
              • Tanpa dependensi native C++ eksternal sehingga 100% kompatibel dan aman dijalankan di Android Termux.
            </p>
          </div>
        </div>

        {/* Brute Force & Session Card */}
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-xs text-zinc-200">Sesi & Anti-Brute-Force</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Proteksi Aktif
            </span>
          </div>

          <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
            <p>
              • <b>Rate Limiter:</b> Maksimal 5 percobaan login gagal berturut-turut sebelum akun/IP diblokir sementara selama 60 detik.
            </p>
            <p>
              • <b>Cookie HttpOnly:</b> Mencegah pencurian session id melalui script XSS pada browser.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Token Masking Playground */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <FileKey className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">Simulator Masking & Sanitasi Kredensial</h3>
          </div>
          <span className="text-xs text-zinc-400">Zero-Leak Policy</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Uji cara sistem menyamarkan token Telegram API secara otomatis pada tampilan dashboard dan seluruh log output:
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Masukkan Contoh Token Telegram:
            </label>
            <input
              type="text"
              value={testToken}
              onChange={(e) => setTestToken(e.target.value)}
              placeholder="Contoh: 123456789:AAFlm3k_SampleToken123456789"
              className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-zinc-200 focus:outline-none"
            />
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Hasil Masking Aman untuk Tampilan UI & Log:
              </span>
              <button
                onClick={() => setShowMasked(!showMasked)}
                className="text-[11px] text-zinc-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
              >
                {showMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showMasked ? 'Sembunyikan' : 'Buka Masking'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs flex items-center justify-between">
              <span className="text-sky-400 break-all">
                {showMasked ? maskToken(testToken) : testToken}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 ml-2">
                Sanitized
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Karakter sensitif setelah tanda titik dua disamarkan dengan titik pelindung untuk mencegah terekspos ke layar atau log publik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
