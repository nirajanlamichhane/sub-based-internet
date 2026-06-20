import type { CloudSession } from "../types/session.js";

export class OfflineCache {
  private sessions: CloudSession[] = [];
  private lastSuccessAt = 0;

  markSuccess(sessions: CloudSession[]) {
    this.sessions = sessions;
    this.lastSuccessAt = Date.now();
  }

  getCached(graceMs: number): CloudSession[] | null {
    if (!this.sessions.length) return null;
    if (Date.now() - this.lastSuccessAt > graceMs) return null;
    return this.sessions;
  }

  isOfflineBeyondGrace(graceMs: number): boolean {
    if (!this.lastSuccessAt) return false;
    return Date.now() - this.lastSuccessAt > graceMs;
  }
}
