import { User } from '../types.js';
import { Send, LogOut, Radio, Terminal, Cpu } from 'lucide-react';

interface Props {
  user: User | null;
  activeCount: number;
  totalCount: number;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  isTermux?: boolean;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({
  user,
  activeCount,
  totalCount,
  wsStatus,
  isTermux,
  onLogout,
  activeTab,
  setActiveTab,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/80 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold">
            <Send className="w-5 h-5 -rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-zinc-100 tracking-tight">Telegram Bot Manager</span>
              {isTermux && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Terminal className="w-3 h-3" /> Termux
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">Multi-Bot Runtime Dashboard</p>
          </div>
        </div>

        {/* Center Navigation Pills (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('bots')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'bots' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Kelola Bot ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'logs' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Live Log
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'system' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Diagnosa & Backup
          </button>
        </nav>

        {/* Status Indicators & User Profile */}
        <div className="flex items-center gap-3">
          {/* Active Bot Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-zinc-400">Aktif:</span>
            <span className="font-semibold text-emerald-400">
              {activeCount} / {totalCount}
            </span>
          </div>

          {/* WebSocket Status Indicator */}
          <div
            title={`WebSocket: ${wsStatus}`}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
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
            <span className="text-[11px] text-zinc-400 hidden lg:inline">
              {wsStatus === 'connected' ? 'Realtime' : 'Reconnecting'}
            </span>
          </div>

          {/* User & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <span className="text-xs font-medium text-zinc-300 hidden md:inline">{user.username}</span>
              <button
                onClick={onLogout}
                title="Keluar / Logout"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden items-center justify-around mt-3 pt-2 border-t border-zinc-800/60 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-1 px-2 font-medium ${activeTab === 'dashboard' ? 'text-sky-400 font-semibold border-b-2 border-sky-400' : 'text-zinc-400'}`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('bots')}
          className={`py-1 px-2 font-medium ${activeTab === 'bots' ? 'text-sky-400 font-semibold border-b-2 border-sky-400' : 'text-zinc-400'}`}
        >
          Bot ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-1 px-2 font-medium ${activeTab === 'logs' ? 'text-sky-400 font-semibold border-b-2 border-sky-400' : 'text-zinc-400'}`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`py-1 px-2 font-medium ${activeTab === 'system' ? 'text-sky-400 font-semibold border-b-2 border-sky-400' : 'text-zinc-400'}`}
        >
          Sistem
        </button>
      </div>
    </header>
  );
}
