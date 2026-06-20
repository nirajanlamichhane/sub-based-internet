import { z } from "zod";

const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export const createVouchersSchema = z.object({
  planId: z.string().min(1),
  locationId: z.string().min(1),
  count: z.number().int().min(1).max(100).default(1),
  expiresInHours: z.number().int().positive().default(168),
});

export const redeemVoucherSchema = z.object({
  token: z.string().min(8),
  macAddress: z.string().regex(macRegex, "Invalid MAC address format"),
  locationSlug: z.string().min(1),
  ipAddress: z.string().optional(),
});

export type CreateVouchersInput = z.infer<typeof createVouchersSchema>;
export type RedeemVoucherInput = z.infer<typeof redeemVoucherSchema>;
