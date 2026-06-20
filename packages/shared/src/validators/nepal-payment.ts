import { z } from "zod";
import { SaaSPlan } from "../constants/enums";

export const nepalPaymentInitSchema = z.object({
  plan: z.enum([SaaSPlan.STARTER, SaaSPlan.BUSINESS, SaaSPlan.ENTERPRISE]),
  provider: z.enum(["esewa", "khalti"]),
});

export const khaltiVerifySchema = z.object({
  token: z.string().min(1),
  amount: z.number().positive(),
  paymentId: z.string().min(1),
});

export type NepalPaymentInitInput = z.infer<typeof nepalPaymentInitSchema>;
export type KhaltiVerifyInput = z.infer<typeof khaltiVerifySchema>;
