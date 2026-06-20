import type { GatewayConfig, GatewayDriverName } from "../types/config.js";

function parseDriver(value: string | undefined): GatewayDriverName {
  if (value === "openwrt") return "openwrt";
  if (value === "mikrotik") return "mikrotik";
  return "mock";
}

export function loadConfig(): GatewayConfig {
  return {
    apiUrl: (process.env.GATEWAY_API_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    gatewayKey: process.env.GATEWAY_KEY ?? "dev-gateway-key-downtown",
    driver: parseDriver(process.env.GATEWAY_DRIVER),
    pollIntervalMs: Number(process.env.GATEWAY_POLL_MS ?? 30_000),
    usageReportIntervalMs: Number(process.env.GATEWAY_USAGE_MS ?? 300_000),
    firmwareVersion: process.env.GATEWAY_FIRMWARE ?? "1.0.0",
    offlineGraceMs: Number(process.env.GATEWAY_OFFLINE_GRACE_MS ?? 3_600_000),
    lanDev: process.env.GATEWAY_LAN_DEV ?? "br-lan",
  };
}

export const startedAt = Date.now();

export function uptimeSeconds(): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}
