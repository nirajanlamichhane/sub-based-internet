import { z } from "zod";
import { SaaSPlan } from "../constants/enums";

export const checkoutSchema = z.object({
  plan: z.enum([SaaSPlan.STARTER, SaaSPlan.BUSINESS, SaaSPlan.ENTERPRISE]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
