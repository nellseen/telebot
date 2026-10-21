import { Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { supervisor } from '../supervisor/supervisor.js';
import { subscribeToLogs, logger, LogEntry } from '../logger.js';
import { BotRuntimeStatus } from '../supervisor/types.js';

interface ClientSocket extends WebSocket {
  isAlive: boolean;
}

export function initWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Broadcast helper
  function broadcast(event: string, payload: unknown) {
    const message = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Subscribe to supervisor state changes
  supervisor.onStateChange((status: BotRuntimeStatus) => {
    broadcast('bot:status', status);
  });

  // Subscribe to logger for real-time logs
  subscribeToLogs((entry: LogEntry) => {
    broadcast('bot:log', entry);
  });

  wss.on('connection', (ws: ClientSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (messageRaw) => {
      try {
        const parsed = JSON.parse(messageRaw.toString());
        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
        }
      } catch {
        // ignore invalid json
      }
    });

    // Send initial greeting
    ws.send(
      JSON.stringify({
        event: 'system:connected',
        data: { message: 'Connected to Telegram Bot Manager Realtime Hub' },
      })
    );
  });

  // Keepalive ping interval every 30s
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const socket = client as ClientSocket;
      if (!socket.isAlive) {
        return socket.terminate();
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('WS_SERVER', 'WebSocket server initialized on path /ws');

  return { wss, broadcast };
}
