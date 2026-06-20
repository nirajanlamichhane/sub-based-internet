export interface GatewayDriver {
  readonly name: string;
  allowMac(mac: string, speedMbps: number, ipAddress?: string | null): Promise<void>;
  blockMac(mac: string): Promise<void>;
  updateSpeed?(mac: string, speedMbps: number): Promise<void>;
}
