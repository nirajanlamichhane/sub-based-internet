import { execFile } from "child_process";
import { promisify } from "util";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { GatewayDriver } from "../types/driver.js";

const execFileAsync = promisify(execFile);
const scriptDir = join(dirname(fileURLToPath(import.meta.url)), "../script");

async function runScript(name: string, args: string[]): Promise<void> {
  const scriptPath = join(scriptDir, name);
  if (process.env.GATEWAY_DRY_RUN === "1") {
    console.log(`[OpenWrtDriver] DRY-RUN ${name} ${args.join(" ")}`);
    return;
  }

  try {
    const { stdout, stderr } = await execFileAsync("sh", [scriptPath, ...args], {
      timeout: 10_000,
    });
    if (stdout.trim()) console.log(`[OpenWrtDriver] ${stdout.trim()}`);
    if (stderr.trim()) console.warn(`[OpenWrtDriver] ${stderr.trim()}`);
  } catch (err) {
    console.warn(
      `[OpenWrtDriver] Script ${name} failed (stub — run on OpenWRT device):`,
      err instanceof Error ? err.message : err,
    );
  }
}

/** OpenWRT driver — delegates to shell scripts for iptables + tc on device */
export class OpenWrtDriver implements GatewayDriver {
  readonly name = "openwrt";

  async allowMac(mac: string, speedMbps: number, ipAddress?: string | null): Promise<void> {
    await runScript("allow-mac.sh", [mac, String(speedMbps), ipAddress ?? ""]);
  }

  async blockMac(mac: string): Promise<void> {
    await runScript("block-mac.sh", [mac]);
  }

  async updateSpeed(mac: string, speedMbps: number): Promise<void> {
    await runScript("shape-mac.sh", [mac, String(speedMbps)]);
  }
}
