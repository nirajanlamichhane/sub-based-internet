import { z } from "zod";

export const gatewayHeartbeatSchema = z.object({
  firmwareVersion: z.string().optional(),
  uptimeSeconds: z.number().int().nonnegative().optional(),
  wanStatus: z.enum(["up", "down"]).optional(),
});

export const gatewayUsageSchema = z.object({
  reports: z.array(
    z.object({
      sessionId: z.string().min(1),
      bytesIn: z.number().int().nonnegative(),
      bytesOut: z.number().int().nonnegative(),
    }),
  ),
});

export type GatewayHeartbeatInput = z.infer<typeof gatewayHeartbeatSchema>;
export type GatewayUsageInput = z.infer<typeof gatewayUsageSchema>;
