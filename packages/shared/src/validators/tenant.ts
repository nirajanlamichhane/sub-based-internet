import { z } from "zod";
import { LicenseStatus, SaaSPlan } from "../constants/enums";

export const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  plan: z.enum([SaaSPlan.STARTER, SaaSPlan.BUSINESS, SaaSPlan.ENTERPRISE]).optional(),
  licenseStatus: z
    .enum([LicenseStatus.ACTIVE, LicenseStatus.GRACE, LicenseStatus.EXPIRED])
    .optional(),
  ownerEmail: z.string().email().optional(),
  ownerPassword: z.string().min(6).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  plan: z.enum([SaaSPlan.STARTER, SaaSPlan.BUSINESS, SaaSPlan.ENTERPRISE]).optional(),
  licenseStatus: z
    .enum([LicenseStatus.ACTIVE, LicenseStatus.GRACE, LicenseStatus.EXPIRED])
    .optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
