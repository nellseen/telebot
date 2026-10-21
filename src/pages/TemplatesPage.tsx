import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BotItem } from '../types.js';
import { BOT_COMMANDS } from '../utils/commands.js';
import {
  Command,
  Send,
  Sparkles,
  Bot,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface Props {
  bots: BotItem[];
  onAddBotClick: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  buttons?: Array<{ label: string; action: string }>;
  timestamp: string;
}

export function TemplatesPage({ bots, onAddBotClick }: Props) {
  const [selectedBotId, setSelectedBotId] = useState<string>(bots[0]?.id || '');
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'bot',
      text: '🤖 Selamat datang di Telegram Chat Simulator!\nPilih salah satu bot Anda dan kirim perintah seperti <b>/start</b>, <b>/help</b>, <b>/ping</b>, <b>/id</b>, <b>/about</b>, atau <b>/menu</b> untuk menguji respons template.',
      timestamp: 'Baru saja',
    },
  ]);

  const activeBot = bots.find((b) => b.id === selectedBotId) || bots[0];

  const handleSendCommand = (commandText: string) => {
    const trimmed = commandText.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Simulate bot response based on template engine
    setTimeout(() => {
      let botResponse = '';
      let buttons: Array<{ label: string; action: string }> | undefined = undefined;

      const cmd = trimmed.toLowerCase();
      const botName = activeBot?.name || 'Telegram Bot';
      const botUsername = activeBot?.username || 'sample_bot';

      if (cmd === '/start') {
        botResponse = `👋 Halo! Selamat datang di <b>@${botUsername}</b>.\n\nBot ini siap melayani Anda melalui perintah bawaan. Gunakan <b>/help</b> untuk melihat panduan atau <b>/menu</b> untuk membuka menu interaktif.`;
        buttons = [
          { label: '🏠 Beranda', action: 'home' },
          { label: '❓ Bantuan', action: 'help' },
          { label: '⚡ Status', action: 'status' },
          { label: 'ℹ️ Tentang', action: 'about' },
        ];
      } else if (cmd === '/help') {
        botResponse =
          `📖 <b>Daftar Perintah Aktif:</b>\n\n` +
          `• <b>/start</b> — Memulai bot dan menu utama\n` +
          `• <b>/help</b> — Menampilkan panduan ini\n` +
          `• <b>/id</b> — Melihat User ID & Chat ID\n` +
          `• <b>/ping</b> — Mengukur latensi pemrosesan\n` +
          `• <b>/about</b> — Informasi bot & platform\n` +
          `• <b>/menu</b> — Menu keyboard interaktif`;
      } else if (cmd === '/ping') {
        const latency = Math.floor(Math.random() * 25) + 12;
        botResponse = `🏓 <b>Pong!</b>\n\n⚡ Waktu pemrosesan: <b>${latency} ms</b>\n🟢 Status: <b>Online & Siap</b>`;
      } else if (cmd === '/id') {
        botResponse = `🆔 <b>Informasi Identitas</b>\n\n• User ID: <code>987654321</code>\n• Chat ID: <code>987654321</code>\n• Tipe Chat: <code>private</code>`;
      } else if (cmd === '/about') {
        botResponse = `🤖 <b>Tentang Bot</b>\n\n• Nama: <b>${botName}</b>\n• Username: @${botUsername}\n• Engine: grammY (TypeScript)\n• Database: SQLite Persisten\n• Platform: Android Termux & Linux`;
      } else if (cmd === '/menu') {
        botResponse = `📋 <b>Menu Utama Bot:</b>\nPilih salah satu opsi navigasi di bawah:`;
        buttons = [
          { label: '🏠 Beranda', action: 'home' },
          { label: '❓ Bantuan', action: 'help' },
          { label: '⚡ Status', action: 'status' },
          { label: 'ℹ️ Informasi', action: 'about' },
        ];
      } else {
        botResponse = `Pesan diterima: "<i>${trimmed}</i>".\nGunakan <b>/help</b> untuk melihat daftar perintah yang didukung.`;
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: botResponse,
        buttons,
        timestamp: new Date().toLocaleTimeString(),
      };

      setChatMessages((prev) => [...prev, botMsg]);
    }, 350);
  };

  const handleButtonClick = (action: string) => {
    let responseText = '';
    switch (action) {
      case 'home':
        responseText = '🏠 <b>Beranda:</b> Bot berjalan dalam performa optimal.';
        break;
      case 'help':
        responseText = '❓ <b>Pusat Bantuan:</b> Semua perintah siap digunakan.';
        break;
      case 'status':
        responseText = '⚡ <b>Status Bot:</b> Online, long polling aktif, 0 error.';
        break;
      case 'about':
        responseText = 'ℹ️ <b>Informasi:</b> Dikelola via Telegram Bot Manager.';
        break;
      default:
        responseText = 'Aksi diterima.';
    }

    const botMsg: ChatMessage = {
      id: `msg-${Date.now()}-btn`,
      sender: 'bot',
      text: responseText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setChatMessages((prev) => [...prev, botMsg]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Standard Template Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Template & Perintah Bawaan Telegram
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl">
              Setiap bot yang Anda daftarkan otomatis mewarisi 6 perintah inti dan inline menu interaktif tanpa perlu menulis kode tambahan.
            </p>
          </div>

          {bots.length === 0 && (
            <button
              onClick={onAddBotClick}
              className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Tambah Bot Pertama</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Command Documentation & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Built-in Command Reference (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Command className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-sm text-white">Perintah Bawaan (Out-of-the-Box)</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">6 Perintah</span>
            </div>

            <div className="space-y-2.5">
              {BOT_COMMANDS.map((cmd) => (
                <div
                  key={cmd.command}
                  className="glass-card p-3 rounded-2xl flex items-start justify-between gap-3 group cursor-pointer"
                  onClick={() => handleSendCommand(`/${cmd.command}`)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400 group-hover:text-sky-300 transition-colors">
                        /{cmd.command}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.04]">
                        {cmd.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      {cmd.description}
                    </p>
                  </div>
                  <button
                    title="Uji Perintah di Simulator"
                    className="p-1.5 rounded-xl bg-white/[0.04] group-hover:bg-sky-500/20 group-hover:text-sky-400 text-zinc-400 transition-colors shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Tips Kustomisasi:</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Isi pesan sambutan <code>/start</code> dan aktivasi tombol inline <code>/menu</code> dapat diatur tersendiri per bot di tab <b>Daftar Bot → Settings</b>.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Telegram Chat Simulator (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-5 rounded-3xl flex flex-col h-[600px] justify-between shadow-2xl relative overflow-hidden">
            {/* Simulator Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white">
                      {activeBot ? activeBot.name : 'Bot Simulator'}
                    </h3>
                    <p className="text-[10px] text-sky-400">
                      @{activeBot ? activeBot.username : 'simulator_bot'} • bot
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {bots.length > 1 && (
                    <select
                      value={selectedBotId}
                      onChange={(e) => setSelectedBotId(e.target.value)}
                      className="text-xs bg-zinc-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                    >
                      {bots.map((b) => (
                        <option key={b.id} value={b.id}>
                          @{b.username}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() =>
                      setChatMessages([
                        {
                          id: 'reset',
                          sender: 'bot',
                          text: 'Simulasi chat telah di-reset. Silakan kirim perintah baru.',
                          timestamp: new Date().toLocaleTimeString(),
                        },
                      ])
                    }
                    title="Bersihkan Simulator"
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Bubbles Viewport */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              <AnimatePresence initial={false}>
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-sky-600 text-white rounded-br-sm'
                          : 'bg-zinc-900/90 text-zinc-200 border border-white/[0.08] rounded-bl-sm'
                      }`}
                    >
                      <div
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                      />
                      <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Inline Keyboard Buttons attached to bot message */}
                    {msg.buttons && (
                      <div className="grid grid-cols-2 gap-1.5 mt-2 max-w-[85%] w-full">
                        {msg.buttons.map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleButtonClick(btn.action)}
                            className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-sky-500/20 hover:border-sky-500/30 border border-white/[0.08] text-xs font-medium text-sky-300 transition-all text-center active:scale-95 shadow-sm"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Quick Command Suggestions */}
            <div className="pt-2 pb-1 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {['/start', '/help', '/id', '/ping', '/about', '/menu'].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => handleSendCommand(cmd)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-sky-500/20 text-zinc-300 hover:text-sky-300 border border-white/[0.06] font-mono whitespace-nowrap transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCommand(inputMessage);
              }}
              className="flex items-center gap-2 pt-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik perintah (contoh: /start, /ping)..."
                className="flex-1 glass-input px-3.5 py-2.5 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition-all shadow-lg shadow-sky-600/20 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
