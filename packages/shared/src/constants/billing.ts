import type { SaaSPlan } from "./enums";

export interface SaasPlanPricing {
  monthlyUsd: number;
  label: string;
  features: string[];
}

export const SAAS_PLAN_PRICING: Record<SaaSPlan, SaasPlanPricing> = {
  STARTER: {
    monthlyUsd: 20,
    label: "Starter",
    features: ["1 location", "Captive portal & QR vouchers", "Basic reports"],
  },
  BUSINESS: {
    monthlyUsd: 79,
    label: "Business",
    features: ["Up to 5 locations", "All Starter features", "Priority support"],
  },
  ENTERPRISE: {
    monthlyUsd: 199,
    label: "Enterprise",
    features: ["Unlimited locations", "All Business features", "Custom SLA"],
  },
};

/** Stripe subscription statuses that map to active license */
export const STRIPE_ACTIVE_STATUSES = new Set(["active", "trialing"]);

/** Stripe statuses that trigger grace period */
export const STRIPE_GRACE_STATUSES = new Set(["past_due", "unpaid"]);
