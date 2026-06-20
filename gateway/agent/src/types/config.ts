export type GatewayDriverName = "mock" | "openwrt";

export interface GatewayConfig {
  apiUrl: string;
  gatewayKey: string;
  driver: GatewayDriverName;
  pollIntervalMs: number;
  usageReportIntervalMs: number;
  firmwareVersion: string;
  offlineGraceMs: number;
}
