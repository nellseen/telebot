import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, setClientToken } from './services/api.js';
import { wsService } from './services/ws.js';
import { User, BotItem, SystemInfo, LogEntry } from './types.js';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { BotsPage } from './pages/BotsPage.js';
import { TemplatesPage } from './pages/TemplatesPage.js';
import { LogsPage } from './pages/LogsPage.js';
import { DatabasePage } from './pages/DatabasePage.js';
import { SecurityPage } from './pages/SecurityPage.js';
import { SystemPage } from './pages/SystemPage.js';
import { AddBotModal } from './components/AddBotModal.js';
import { BotSettingsModal } from './components/BotSettingsModal.js';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // All 7 distinct features in sidebar
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [bots, setBots] = useState<BotItem[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Mobile sidebar drawer state
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Modals state
  const [isAddBotOpen, setIsAddBotOpen] = useState(false);
  const [settingsBot, setSettingsBot] = useState<BotItem | null>(null);
  const [selectedLogBotId, setSelectedLogBotId] = useState<string | undefined>(undefined);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial auth check
  const checkSession = useCallback(async () => {
    try {
      const res = await api.getSession();
      setNeedsBootstrap(res.needsBootstrap);
      if (res.authenticated && res.user) {
        setAuthenticated(true);
        setUser(res.user);
        if (res.sessionId) setClientToken(res.sessionId);
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch {
      setAuthenticated(false);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // 2. Load bots & system info once authenticated
  const loadData = useCallback(async () => {
    if (!authenticated) return;
    try {
      const [botsRes, sysRes] = await Promise.all([api.getBots(), api.getSystemInfo()]);
      setBots(botsRes.bots || []);
      setSystemInfo(sysRes);
    } catch {
      // ignore
    }
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) {
      loadData();
      wsService.connect();

      const unsubStatus = wsService.onStatusChange((status) => {
        setWsStatus(status);
      });

      // Handle live bot status events
      const unsubBotStatus = wsService.on('bot:status', (statusPayload: any) => {
        setBots((prev) =>
          prev.map((bot) => {
            if (bot.id === statusPayload.botId) {
              return {
                ...bot,
                status: statusPayload.observedState,
                desiredState: statusPayload.desiredState,
                uptimeSeconds: statusPayload.uptimeSeconds || bot.uptimeSeconds,
                startedAt: statusPayload.startedAt || bot.startedAt,
                lastErrorCode: statusPayload.lastErrorCode ?? bot.lastErrorCode,
              };
            }
            return bot;
          })
        );
      });

      // Handle live logs events
      const unsubLogs = wsService.on('bot:log', (logEntry: LogEntry) => {
        setRecentLogs((prev) => [...prev.slice(-100), logEntry]);
      });

      return () => {
        unsubStatus();
        unsubBotStatus();
        unsubLogs();
        wsService.disconnect();
      };
    }
  }, [authenticated, loadData]);

  // Bot Lifecycle Handlers
  const handleStartBot = async (id: string) => {
    try {
      await api.startBot(id);
      showToast('success', 'Perintah start dikirim ke supervisor bot');
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memulai bot');
    }
  };

  const handleStopBot = async (id: string) => {
    try {
      await api.stopBot(id);
      showToast('success', 'Bot berhasil dihentikan');
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghentikan bot');
    }
  };

  const handleRestartBot = async (id: string) => {
    try {
      await api.restartBot(id);
      showToast('success', 'Bot berhasil di-restart');
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal me-restart bot');
    }
  };

  const handleDeleteBot = async (id: string) => {
    try {
      await api.deleteBot(id);
      showToast('success', 'Bot berhasil dihapus');
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus bot');
    }
  };

  const handleValidateToken = async (id: string) => {
    try {
      const res = await api.validateToken(id);
      if (res.valid) {
        showToast('success', 'Token valid! Terhubung dengan Telegram Bot API');
      } else {
        showToast('error', res.error || 'Token tidak valid');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memeriksa token');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setAuthenticated(false);
      setUser(null);
      setClientToken(null);
      wsService.disconnect();
    } catch {
      setAuthenticated(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          <p className="text-xs">Memuat TeleBot Manager...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginPage
        needsBootstrap={needsBootstrap}
        isTermux={systemInfo?.isTermux}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          setAuthenticated(true);
        }}
      />
    );
  }

  const activeCount = bots.filter((b) => b.status === 'RUNNING').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-x-hidden selection:bg-sky-500/25 selection:text-sky-200">
      {/* Liquid Ambient Glowing Aura Blobs (Smoothly floating in background) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-sky-500/12 blur-[120px] animate-blob-1" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px] animate-blob-2" />
        <div className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] rounded-full bg-teal-500/8 blur-[140px] animate-blob-3" />
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-medium backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-200 shadow-emerald-950/50'
                : 'bg-rose-950/85 border-rose-500/30 text-rose-200 shadow-rose-950/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Full App Flex Layout: Sidebar + Main Content */}
      <div className="relative z-10 flex min-h-screen">
        {/* Persistent Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          botsCount={bots.length}
          activeBotsCount={activeCount}
          wsStatus={wsStatus}
          isTermux={systemInfo?.isTermux}
          user={user}
          onLogout={handleLogout}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
          onAddBotClick={() => setIsAddBotOpen(true)}
        />

        {/* Main Content Workspace Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <Navbar
            user={user}
            activeTab={activeTab}
            activeCount={activeCount}
            totalCount={bots.length}
            wsStatus={wsStatus}
            onLogout={handleLogout}
            onOpenMobileSidebar={() => setIsOpenMobile(true)}
            onAddBotClick={() => setIsAddBotOpen(true)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {activeTab === 'dashboard' && (
                  <DashboardPage
                    bots={bots}
                    systemInfo={systemInfo}
                    recentLogs={recentLogs}
                    onAddBotClick={() => setIsAddBotOpen(true)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onRefresh={loadData}
                  />
                )}

                {activeTab === 'bots' && (
                  <BotsPage
                    bots={bots}
                    onStartBot={handleStartBot}
                    onStopBot={handleStopBot}
                    onRestartBot={handleRestartBot}
                    onDeleteBot={handleDeleteBot}
                    onValidateToken={handleValidateToken}
                    onOpenSettings={(bot) => setSettingsBot(bot)}
                    onOpenLogs={(bot) => {
                      setSelectedLogBotId(bot.id);
                      setActiveTab('logs');
                    }}
                    onAddBotClick={() => setIsAddBotOpen(true)}
                    onRefresh={loadData}
                  />
                )}

                {activeTab === 'templates' && (
                  <TemplatesPage
                    bots={bots}
                    onAddBotClick={() => setIsAddBotOpen(true)}
                  />
                )}

                {activeTab === 'logs' && (
                  <LogsPage
                    bots={bots}
                    selectedBotId={selectedLogBotId}
                    wsStatus={wsStatus}
                  />
                )}

                {activeTab === 'database' && (
                  <DatabasePage
                    systemInfo={systemInfo}
                    onRefresh={loadData}
                  />
                )}

                {activeTab === 'security' && (
                  <SecurityPage />
                )}

                {activeTab === 'system' && (
                  <SystemPage
                    systemInfo={systemInfo}
                    onRefresh={loadData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="mt-auto border-t border-white/[0.06] bg-zinc-950/40 backdrop-blur-md px-4 py-3.5 text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>TeleBot Hub • Liquid Glass Multi-Bot Manager & grammY Engine</span>
              <span className="font-mono text-[11px] text-zinc-400">
                SQLite · AES-256-GCM · Android Termux & Linux
              </span>
            </div>
          </footer>
        </div>
      </div>

      {/* Add Bot Modal */}
      <AddBotModal
        isOpen={isAddBotOpen}
        onClose={() => setIsAddBotOpen(false)}
        onSuccess={(newBot) => {
          showToast('success', `Bot @${newBot.username} berhasil ditambahkan!`);
          loadData();
        }}
      />

      {/* Bot Settings Modal */}
      {settingsBot && (
        <BotSettingsModal
          bot={settingsBot}
          isOpen={true}
          onClose={() => setSettingsBot(null)}
          onUpdated={(updatedBot) => {
            showToast('success', `Pengaturan ${updatedBot.name} disimpan`);
            loadData();
          }}
        />
      )}
    </div>
  );
}
