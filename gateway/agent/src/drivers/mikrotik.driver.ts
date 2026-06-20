import { execFile } from "child_process";
import { promisify } from "util";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { GatewayDriver } from "../types/driver.js";

const execFileAsync = promisify(execFile);
const scriptDir = join(dirname(fileURLToPath(import.meta.url)), "../script/mikrotik");

function scriptEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  if (process.env.MIKROTIK_HOST) env.MIKROTIK_HOST = process.env.MIKROTIK_HOST;
  if (process.env.MIKROTIK_USER) env.MIKROTIK_USER = process.env.MIKROTIK_USER;
  if (process.env.MIKROTIK_PASS) env.MIKROTIK_PASS = process.env.MIKROTIK_PASS;
  if (process.env.MIKROTIK_SSH_PORT) env.MIKROTIK_SSH_PORT = process.env.MIKROTIK_SSH_PORT;
  return env;
}

async function runScript(name: string, args: string[] = []): Promise<string> {
  const scriptPath = join(scriptDir, name);
  if (process.env.GATEWAY_DRY_RUN === "1") {
    console.log(`[MikroTikDriver] DRY-RUN ${name} ${args.join(" ")}`);
    return "";
  }
  const { stdout, stderr } = await execFileAsync("sh", [scriptPath, ...args], {
    timeout: 20_000,
    env: scriptEnv(),
  });
  if (stderr.trim()) console.warn(`[MikroTikDriver] ${stderr.trim()}`);
  return stdout.trim();
}

function handleScriptError(name: string, err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (process.env.GATEWAY_FAIL_FAST === "1") {
    throw new Error(`Script ${name} failed: ${msg}`);
  }
  console.warn(`[MikroTikDriver] Script ${name} failed: ${msg}`);
  return undefined as never;
}

/** MikroTik driver — RouterOS via SSH shell scripts */
export class MikroTikDriver implements GatewayDriver {
  readonly name = "mikrotik";
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await runScript("init.sh");
      this.initialized = true;
      console.log(`[MikroTikDriver] initialized host=${process.env.MIKROTIK_HOST ?? "127.0.0.1"}`);
    } catch (err) {
      handleScriptError("init", err);
    }
  }

  async allowMac(mac: string, speedMbps: number, ipAddress?: string | null): Promise<void> {
    try {
      const out = await runScript("allow-mac.sh", [mac, String(speedMbps), ipAddress ?? ""]);
      if (out) console.log(`[MikroTikDriver] ${out}`);
    } catch (err) {
      handleScriptError("allow-mac.sh", err);
    }
  }

  async blockMac(mac: string): Promise<void> {
    try {
      const out = await runScript("block-mac.sh", [mac]);
      if (out) console.log(`[MikroTikDriver] ${out}`);
    } catch (err) {
      handleScriptError("block-mac.sh", err);
    }
  }

  async updateSpeed(mac: string, speedMbps: number): Promise<void> {
    try {
      const out = await runScript("shape-mac.sh", [mac, String(speedMbps)]);
      if (out) console.log(`[MikroTikDriver] ${out}`);
    } catch (err) {
      handleScriptError("shape-mac.sh", err);
    }
  }

  async readUsage(mac: string): Promise<{ bytesIn: number; bytesOut: number } | null> {
    try {
      const out = await runScript("read-usage.sh", [mac]);
      if (!out) return null;
      const parsed = JSON.parse(out) as { bytesIn?: number; bytesOut?: number };
      return { bytesIn: parsed.bytesIn ?? 0, bytesOut: parsed.bytesOut ?? 0 };
    } catch {
      return null;
    }
  }

  async shutdown(): Promise<void> {
    try {
      const out = await runScript("teardown.sh");
      if (out) console.log(`[MikroTikDriver] ${out}`);
      this.initialized = false;
    } catch (err) {
      handleScriptError("teardown.sh", err);
    }
  }
}
