import { z } from "zod";

export const createWifiPlanSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(1).max(50),
  durationMins: z.number().int().positive(),
  speedMbps: z.number().int().positive(),
  dataCapMb: z.number().int().positive().nullable().optional(),
  deviceLimit: z.number().int().positive().default(1),
  price: z.number().min(0).default(0),
});

export const updateWifiPlanSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  durationMins: z.number().int().positive().optional(),
  speedMbps: z.number().int().positive().optional(),
  dataCapMb: z.number().int().positive().nullable().optional(),
  deviceLimit: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateWifiPlanInput = z.infer<typeof createWifiPlanSchema>;
export type UpdateWifiPlanInput = z.infer<typeof updateWifiPlanSchema>;
