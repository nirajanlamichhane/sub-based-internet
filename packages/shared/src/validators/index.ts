import { z } from "zod";

export const healthCheckSchema = z.object({
  status: z.literal("ok"),
});

export * from "./auth";
export * from "./tenant";
export * from "./location";
export * from "./wifi-plan";
export * from "./voucher";
export * from "./gateway";
export * from "./billing";
export * from "./portal-sms";
export * from "./nepal-payment";
