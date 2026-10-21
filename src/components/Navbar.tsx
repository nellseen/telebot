import { User } from '../types.js';
import { NavTab } from './Sidebar.js';
import {
  Menu,
  Radio,
  Plus,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface Props {
  user: User | null;
  activeTab: NavTab;
  activeCount: number;
  totalCount: number;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  onLogout: () => void;
  onOpenMobileSidebar: () => void;
  onAddBotClick: () => void;
}

const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'Ringkasan Sistem & Runtime',
  bots: 'Daftar & Manajemen Bot',
  templates: 'Template & Perintah Bawaan',
  logs: 'Live Telemetri & Log Real-time',
  database: 'Penyimpanan & Backup SQLite',
  system: 'Diagnosa Proses & Termux',
  security: 'Keamanan Kredensial & Kunci',
};

export function Navbar({
  user,
  activeTab,
  activeCount,
  totalCount,
  wsStatus,
  onLogout,
  onOpenMobileSidebar,
  onAddBotClick,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-zinc-950/60 backdrop-blur-2xl px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Drawer Trigger & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 hidden sm:inline">Telegram Bot Manager</span>
            <span className="text-zinc-600 hidden sm:inline">/</span>
            <span className="font-semibold text-white tracking-tight">
              {TAB_TITLES[activeTab]}
            </span>
          </div>
        </div>

        {/* Right: Quick Action, WebSocket Status, User Profile */}
        <div className="flex items-center gap-3">
          {/* Active Bot Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs">
            <span className="text-zinc-400">Bot Aktif:</span>
            <span className="font-mono font-bold text-emerald-400">
              {activeCount}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="font-mono text-zinc-300">{totalCount}</span>
          </div>

          {/* WebSocket Pulse */}
          <div
            title={`WebSocket: ${wsStatus}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs"
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                wsStatus === 'connected'
                  ? 'text-emerald-400 animate-pulse'
                  : wsStatus === 'connecting'
                  ? 'text-amber-400 animate-spin'
                  : 'text-rose-400'
              }`}
            />
            <span className="text-[11px] text-zinc-300 hidden md:inline">
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
          </div>

          {/* Add Bot Action Button */}
          <button
            onClick={onAddBotClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Bot</span>
          </button>

          {/* User profile & logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-[11px] text-white uppercase shadow">
                {user.username.slice(0, 2)}
              </div>
              <button
                onClick={onLogout}
                title="Keluar"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
