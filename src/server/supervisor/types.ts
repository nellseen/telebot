export type BotStatus =
  | 'STOPPED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'RESTARTING'
  | 'ERROR';

export interface BotRuntimeStatus {
  botId: string;
  desiredState: BotStatus;
  observedState: BotStatus;
  workerId?: string;
  startedAt?: string | null;
  stoppedAt?: string | null;
  lastHeartbeatAt?: string | null;
  lastErrorCode?: string | null;
  uptimeSeconds: number;
}
