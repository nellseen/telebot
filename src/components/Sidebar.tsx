import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types.js';
import {
  LayoutDashboard,
  Bot,
  Command,
  FileCode2,
  Database,
  Terminal,
  ShieldCheck,
  Send,
  LogOut,
  Radio,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'bots'
  | 'templates'
  | 'logs'
  | 'database'
  | 'system'
  | 'security';

interface Props {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  botsCount: number;
  activeBotsCount: number;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  isTermux?: boolean;
  user: User | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onAddBotClick: () => void;
}

interface NavItemDef {
  id: NavTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItemDef[];
}

export function Sidebar({
  activeTab,
  setActiveTab,
  botsCount,
  activeBotsCount,
  wsStatus,
  isTermux,
  user,
  onLogout,
  isOpenMobile,
  setIsOpenMobile,
  onAddBotClick,
}: Props) {
  const sections: NavSection[] = [
    {
      title: 'Fitur Utama',
      items: [
        {
          id: 'dashboard',
          label: 'Ringkasan',
          description: 'Metrik & status runtime',
          icon: LayoutDashboard,
        },
        {
          id: 'bots',
          label: 'Daftar Bot',
          description: 'Fleet bot & kontrol status',
          icon: Bot,
          badge: `${activeBotsCount}/${botsCount}`,
          badgeColor:
            activeBotsCount > 0
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50',
        },
        {
          id: 'templates',
          label: 'Template & Menu',
          description: 'Menu interaktif & simulator',
          icon: Command,
        },
      ],
    },
    {
      title: 'Data & Telemetri',
      items: [
        {
          id: 'logs',
          label: 'Live Telemetri',
          description: 'Streaming WebSocket realtime',
          icon: FileCode2,
        },
        {
          id: 'database',
          label: 'SQLite & Backup',
          description: 'Snapshot non-blocking & tabel',
          icon: Database,
        },
      ],
    },
    {
      title: 'Keamanan & Sistem',
      items: [
        {
          id: 'security',
          label: 'Keamanan & Kunci',
          description: 'AES-256-GCM & token shield',
          icon: ShieldCheck,
        },
        {
          id: 'system',
          label: 'Diagnosa & Termux',
          description: 'Android runtime & wakelock',
          icon: Terminal,
          badge: isTermux ? 'Android' : undefined,
          badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        },
      ],
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 relative z-10">
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-600 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl">
                <Send className="w-5 h-5 -rotate-12" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">TeleBot Hub</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  SQLite
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Multi-Bot Manager</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Bot Button with Liquid Glow */}
        <button
          onClick={() => {
            onAddBotClick();
            setIsOpenMobile(false);
          }}
          className="w-full relative group overflow-hidden rounded-2xl p-[1px] focus:outline-none transition-all duration-300 active:scale-[0.98]"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity blur-[2px]"></span>
          <span className="relative flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-950/80 backdrop-blur-xl text-xs font-semibold text-white group-hover:bg-zinc-950/60 transition-colors shadow-inner">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Tambah Bot Baru</span>
          </span>
        </button>

        {/* Categorized Navigation */}
        <div className="space-y-4 pt-1">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 px-3 py-1">
                {section.title}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full relative flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 group ${
                        isActive
                          ? 'text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Fluid liquid active background pill with layoutId */}
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarIndicator"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/20 via-blue-500/10 to-transparent border border-sky-500/35 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18)]"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}

                      <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                              : 'bg-white/[0.03] text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/[0.06]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs truncate">{item.label}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{item.description}</div>
                        </div>
                      </div>

                      {item.badge ? (
                        <span
                          className={`relative z-10 text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold shrink-0 ml-1 ${
                            item.badgeColor || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-sky-400/80 relative z-10 shrink-0 ml-1" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Footer: System Status, User Profile & Logout */}
      <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
        {/* Realtime WebSocket Telemetry Indicator */}
        <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${
                wsStatus === 'connected'
                  ? 'text-emerald-400 animate-pulse'
                  : wsStatus === 'connecting'
                  ? 'text-amber-400 animate-spin'
                  : 'text-rose-400'
              }`}
            />
            <span className="text-[11px] text-zinc-300">
              {wsStatus === 'connected'
                ? 'WebSocket Realtime'
                : wsStatus === 'connecting'
                ? 'Menghubungkan...'
                : 'Offline'}
            </span>
          </div>
          {isTermux && (
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Termux
            </span>
          )}
        </div>

        {/* User Profile Bar */}
        {user && (
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-md shrink-0 ring-1 ring-white/10">
                {user.username.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">{user.username}</div>
                <div className="text-[10px] text-zinc-400">Administrator</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Keluar / Logout"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Glass Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 border-r border-white/[0.08] bg-zinc-950/65 backdrop-blur-2xl overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer with AnimatePresence */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpenMobile(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="relative w-72 max-w-[85vw] h-full bg-zinc-950/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
