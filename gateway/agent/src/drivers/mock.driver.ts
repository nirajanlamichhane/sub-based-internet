import type { GatewayDriver } from "../types/driver.js";

export class MockDriver implements GatewayDriver {
  readonly name = "mock";

  async allowMac(mac: string, speedMbps: number, ipAddress?: string | null): Promise<void> {
    const ip = ipAddress ? ` ip=${ipAddress}` : "";
    console.log(`[MockDriver] ALLOW ${mac} @ ${speedMbps}Mbps${ip}`);
  }

  async blockMac(mac: string): Promise<void> {
    console.log(`[MockDriver] BLOCK ${mac}`);
  }

  async updateSpeed(mac: string, speedMbps: number): Promise<void> {
    console.log(`[MockDriver] SHAPE ${mac} @ ${speedMbps}Mbps`);
  }
}
