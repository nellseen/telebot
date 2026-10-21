type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
type EventHandler = (payload: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private reconnectTimer: number | null = null;
  private currentStatus: ConnectionStatus = 'disconnected';
  private shouldConnect = true;

  public connect() {
    this.shouldConnect = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event) {
            const handlers = this.eventHandlers.get(parsed.event);
            if (handlers) {
              handlers.forEach((fn) => fn(parsed.data));
            }
          }
        } catch {
          // ignore invalid json
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        if (this.shouldConnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.setStatus('disconnected');
      };
    } catch {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private setStatus(status: ConnectionStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => this.statusListeners.delete(listener);
  }

  public on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  public disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}

export const wsService = new WebSocketService();
