import type { GatewayConfig } from "../types/config.js";
import { createDriver } from "../drivers/index.js";
import { CloudApiClient } from "./cloud-api.js";
import { loadConfig, uptimeSeconds } from "./config.js";
import { OfflineCache } from "./offline-cache.js";
import { SessionManager } from "./session-manager.js";

export class GatewayAgent {
  private readonly config: GatewayConfig;
  private readonly api: CloudApiClient;
  private readonly sessions: SessionManager;
  private readonly cache = new OfflineCache();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private usageTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(config: GatewayConfig = loadConfig()) {
    this.config = config;
    const driver = createDriver(config.driver);
    this.api = new CloudApiClient(config);
    this.sessions = new SessionManager(driver);
  }

  async start() {
    if (this.running) return;
    this.running = true;

    console.log(`[GatewayAgent] driver=${this.config.driver} api=${this.config.apiUrl}`);
    console.log(`[GatewayAgent] gateway key ending ...${this.config.gatewayKey.slice(-6)}`);

    await this.pollOnce();

    this.pollTimer = setInterval(() => {
      this.pollOnce().catch((err) => this.logError("poll", err));
    }, this.config.pollIntervalMs);

    this.usageTimer = setInterval(() => {
      this.reportUsage().catch((err) => this.logError("usage", err));
    }, this.config.usageReportIntervalMs);
  }

  stop() {
    this.running = false;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.usageTimer) clearInterval(this.usageTimer);
  }

  private async pollOnce() {
    try {
      const heartbeat = await this.api.heartbeat();
      const pollMs = (heartbeat.pollIntervalSeconds ?? 30) * 1000;
      if (pollMs !== this.config.pollIntervalMs) {
        this.config.pollIntervalMs = pollMs;
      }

      console.log(
        `[GatewayAgent] heartbeat license=${heartbeat.licenseStatus}` +
          (heartbeat.warning ? " (grace warning)" : ""),
      );

      const { sessions } = await this.api.getSessions();
      this.cache.markSuccess(sessions);
      await this.sessions.sync(sessions);

      if (sessions.length > 0) {
        console.log(`[GatewayAgent] synced ${sessions.length} active session(s)`);
      }
    } catch (err) {
      this.logError("cloud unreachable", err);

      const cached = this.cache.getCached(this.config.offlineGraceMs);
      if (cached) {
        console.log(`[GatewayAgent] enforcing ${cached.length} cached session(s) (offline mode)`);
        await this.sessions.enforceCached(cached);
      } else if (this.cache.isOfflineBeyondGrace(this.config.offlineGraceMs)) {
        console.warn("[GatewayAgent] offline beyond grace — captive portal only");
      }
    }
  }

  private async reportUsage() {
    if (this.config.driver === "mock") {
      this.sessions.simulateUsage();
    }

    const reports = this.sessions.drainUsageReports();
    if (reports.length === 0) return;

    try {
      const result = await this.api.reportUsage(reports);
      console.log(`[GatewayAgent] reported usage for ${result.received} session(s)`);
    } catch (err) {
      this.logError("usage report", err);
    }
  }

  private logError(context: string, err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[GatewayAgent] ${context}: ${msg}`);
  }
}

export async function runAgent() {
  const agent = new GatewayAgent();
  await agent.start();

  const shutdown = () => {
    console.log("[GatewayAgent] shutting down");
    agent.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
