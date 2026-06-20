import type { GatewayConfig } from "../types/config.js";
import type { HeartbeatResponse, SessionsResponse } from "../types/session.js";
import { uptimeSeconds } from "./config.js";

export class CloudApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CloudApiError";
  }
}

export class CloudApiClient {
  constructor(private readonly config: GatewayConfig) {}

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Gateway-Key": this.config.gatewayKey,
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.config.apiUrl}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init?.headers as Record<string, string>) },
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { message?: string };
        if (body?.message) message = String(body.message);
      } catch {
        /* ignore */
      }
      throw new CloudApiError(message, res.status);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  heartbeat() {
    return this.request<HeartbeatResponse>("/gateway/heartbeat", {
      method: "POST",
      body: JSON.stringify({
        firmwareVersion: this.config.firmwareVersion,
        uptimeSeconds: uptimeSeconds(),
        wanStatus: "up",
      }),
    });
  }

  getSessions() {
    return this.request<SessionsResponse>("/gateway/sessions");
  }

  reportUsage(
    reports: Array<{ sessionId: string; bytesIn: number; bytesOut: number }>,
  ) {
    return this.request<{ received: number }>("/gateway/usage", {
      method: "POST",
      body: JSON.stringify({ reports }),
    });
  }
}
