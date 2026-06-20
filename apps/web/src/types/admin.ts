import type { LicenseStatus, SaaSPlan } from "@sub-based-internet/shared/constants/enums";

export interface TenantRecord {
  id: string;
  name: string;
  plan: SaaSPlan;
  licenseStatus: LicenseStatus;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    locations: number;
    users: number;
  };
}
