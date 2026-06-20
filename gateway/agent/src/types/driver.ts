export interface GatewayDriver {

  readonly name: string;

  initialize?(): Promise<void>;

  shutdown?(): Promise<void>;

  allowMac(mac: string, speedMbps: number, ipAddress?: string | null): Promise<void>;

  blockMac(mac: string): Promise<void>;

  updateSpeed?(mac: string, speedMbps: number): Promise<void>;

  readUsage?(mac: string): Promise<{ bytesIn: number; bytesOut: number } | null>;

}

