import { BotItem, BotConfig, BotLogItem, SystemInfo, BackupItem, AuditLogItem, User } from '../types.js';

let authToken: string | null = null;

export function setClientToken(token: string | null) {
  authToken = token;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly cookies
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `HTTP error ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  getSession: () =>
    request<{ authenticated: boolean; needsBootstrap: boolean; user: User | null; sessionId?: string }>('/api/auth/session'),

  bootstrap: (payload: { username: string; password: string }) =>
    request<{ success: boolean; user: User; sessionId: string }>('/api/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { username: string; password: string }) =>
    request<{ success: boolean; user: User; sessionId: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  // Bots
  getBots: () => request<{ bots: BotItem[] }>('/api/bots'),

  createBot: (payload: { name: string; token: string; autoStart?: boolean }) =>
    request<{ success: boolean; bot: BotItem }>('/api/bots', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getBot: (id: string) => request<{ bot: BotItem }>('/api/bots/' + id),

  updateBot: (id: string, payload: { name?: string; autoStart?: boolean }) =>
    request<{ success: boolean; bot: BotItem }>('/api/bots/' + id, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteBot: (id: string) =>
    request<{ success: boolean; message: string }>('/api/bots/' + id, {
      method: 'DELETE',
    }),

  validateToken: (id: string) =>
    request<{ valid: boolean; bot?: unknown; error?: string }>('/api/bots/' + id + '/validate-token', {
      method: 'POST',
    }),

  startBot: (id: string) =>
    request<{ success: boolean; status: unknown }>('/api/bots/' + id + '/start', {
      method: 'POST',
    }),

  stopBot: (id: string) =>
    request<{ success: boolean; status: unknown }>('/api/bots/' + id + '/stop', {
      method: 'POST',
    }),

  restartBot: (id: string) =>
    request<{ success: boolean; status: unknown }>('/api/bots/' + id + '/restart', {
      method: 'POST',
    }),

  getBotLogs: (id: string, params?: { level?: string; q?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.level) q.set('level', params.level);
    if (params?.q) q.set('q', params.q);
    if (params?.limit) q.set('limit', String(params.limit));
    return request<{ logs: BotLogItem[] }>(`/api/bots/${id}/logs?${q.toString()}`);
  },

  clearBotLogs: (id: string) =>
    request<{ success: boolean }>('/api/bots/' + id + '/logs', {
      method: 'DELETE',
    }),

  getBotConfig: (id: string) => request<{ config: BotConfig }>('/api/bots/' + id + '/config'),

  updateBotConfig: (id: string, payload: Partial<BotConfig>) =>
    request<{ success: boolean; config: BotConfig }>('/api/bots/' + id + '/config', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // System
  getHealth: () => request<{ status: string; uptimeSeconds: number; database: string }>('/api/health'),

  getSystemInfo: () => request<SystemInfo>('/api/system/info'),

  getSystemLogs: (limit = 100) => request<{ logs: unknown[] }>(`/api/system/logs?limit=${limit}`),

  createBackup: () => request<{ success: boolean; backup: BackupItem }>('/api/system/backup', { method: 'POST' }),

  getBackups: () => request<{ backups: BackupItem[] }>('/api/system/backups'),

  getAuditLogs: () => request<{ auditLogs: AuditLogItem[] }>('/api/system/audit-logs'),
};
