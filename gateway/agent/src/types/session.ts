export interface CloudSession {
  sessionId: string;
  macAddress: string;
  ipAddress: string | null;
  speedMbps: number;
  expiresAt: string;
  status: string;
}

export interface SessionsResponse {
  sessions: CloudSession[];
}

export interface HeartbeatResponse {
  licenseStatus: string;
  warning?: boolean;
  pollIntervalSeconds: number;
  serverTime: string;
  wanStatus?: string;
}

export interface EnforcedSession {
  sessionId: string;
  macAddress: string;
  ipAddress: string | null;
  speedMbps: number;
}
