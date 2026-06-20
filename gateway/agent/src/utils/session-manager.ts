import type { GatewayDriver } from "../types/driver.js";
import type { CloudSession, EnforcedSession } from "../types/session.js";

function normalizeMac(mac: string): string {
  return mac.toLowerCase();
}

export class SessionManager {
  private enforced = new Map<string, EnforcedSession>();
  private usageCounters = new Map<string, { bytesIn: number; bytesOut: number }>();

  constructor(private readonly driver: GatewayDriver) {}

  getEnforcedSessions(): EnforcedSession[] {
    return [...this.enforced.values()];
  }

  drainUsageReports(): Array<{ sessionId: string; bytesIn: number; bytesOut: number }> {
    const reports: Array<{ sessionId: string; bytesIn: number; bytesOut: number }> = [];
    for (const [sessionId, usage] of this.usageCounters) {
      if (usage.bytesIn > 0 || usage.bytesOut > 0) {
        reports.push({ sessionId, bytesIn: usage.bytesIn, bytesOut: usage.bytesOut });
        this.usageCounters.set(sessionId, { bytesIn: 0, bytesOut: 0 });
      }
    }
    return reports;
  }

  /** Mock usage increment for dev — real driver reads iface stats in production */
  simulateUsage() {
    for (const session of this.enforced.values()) {
      const current = this.usageCounters.get(session.sessionId) ?? { bytesIn: 0, bytesOut: 0 };
      this.usageCounters.set(session.sessionId, {
        bytesIn: current.bytesIn + 50_000,
        bytesOut: current.bytesOut + 25_000,
      });
    }
  }

  async sync(cloudSessions: CloudSession[]) {
    const active = cloudSessions.filter(
      (s) => s.status === "ACTIVE" && new Date(s.expiresAt).getTime() > Date.now(),
    );

    const nextMacs = new Set(active.map((s) => normalizeMac(s.macAddress)));
    const currentMacs = new Set(this.enforced.keys());

    for (const mac of currentMacs) {
      if (!nextMacs.has(mac)) {
        await this.driver.blockMac(mac);
        const session = this.enforced.get(mac);
        if (session) this.usageCounters.delete(session.sessionId);
        this.enforced.delete(mac);
      }
    }

    for (const session of active) {
      const mac = normalizeMac(session.macAddress);
      const existing = this.enforced.get(mac);

      if (!existing) {
        await this.driver.allowMac(mac, session.speedMbps, session.ipAddress);
        this.enforced.set(mac, {
          sessionId: session.sessionId,
          macAddress: mac,
          ipAddress: session.ipAddress,
          speedMbps: session.speedMbps,
        });
        this.usageCounters.set(session.sessionId, { bytesIn: 0, bytesOut: 0 });
        continue;
      }

      if (existing.speedMbps !== session.speedMbps) {
        if (this.driver.updateSpeed) {
          await this.driver.updateSpeed(mac, session.speedMbps);
        } else {
          await this.driver.allowMac(mac, session.speedMbps, session.ipAddress);
        }
        existing.speedMbps = session.speedMbps;
      }

      if (existing.sessionId !== session.sessionId) {
        this.usageCounters.delete(existing.sessionId);
        existing.sessionId = session.sessionId;
        this.usageCounters.set(session.sessionId, { bytesIn: 0, bytesOut: 0 });
      }

      existing.ipAddress = session.ipAddress;
    }
  }

  async enforceCached(sessions: CloudSession[]) {
    await this.sync(sessions);
  }
}
