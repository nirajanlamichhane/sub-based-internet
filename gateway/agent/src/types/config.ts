export type GatewayDriverName = "mock" | "openwrt" | "mikrotik";

export interface GatewayConfig {
  apiUrl: string;
  gatewayKey: string;
  driver: GatewayDriverName;
  pollIntervalMs: number;
  usageReportIntervalMs: number;
  firmwareVersion: string;
  offlineGraceMs: number;
  lanDev: string;
}
