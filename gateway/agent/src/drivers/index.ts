import type { GatewayDriverName } from "../types/config.js";
import type { GatewayDriver } from "../types/driver.js";
import { MockDriver } from "./mock.driver.js";
import { OpenWrtDriver } from "./openwrt.driver.js";

export function createDriver(name: GatewayDriverName): GatewayDriver {
  switch (name) {
    case "openwrt":
      return new OpenWrtDriver();
    case "mock":
    default:
      return new MockDriver();
  }
}

export type { GatewayDriver } from "../types/driver.js";
