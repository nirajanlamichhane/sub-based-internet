export const APP_NAME = "Sub-Based Internet";

/** SaaS subscription tier for venue owners */
export const SaaSPlan = {
  STARTER: "STARTER",
  BUSINESS: "BUSINESS",
  ENTERPRISE: "ENTERPRISE",
} as const;
export type SaaSPlan = (typeof SaaSPlan)[keyof typeof SaaSPlan];

export const SAAS_PLAN_LOCATION_LIMITS: Record<SaaSPlan, number | null> = {
  STARTER: 1,
  BUSINESS: 5,
  ENTERPRISE: null,
};

export const LicenseStatus = {
  ACTIVE: "ACTIVE",
  GRACE: "GRACE",
  EXPIRED: "EXPIRED",
} as const;
export type LicenseStatus = (typeof LicenseStatus)[keyof typeof LicenseStatus];

export const Role = {
  OWNER: "OWNER",
  STAFF: "STAFF",
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const VoucherStatus = {
  ACTIVE: "ACTIVE",
  REDEEMED: "REDEEMED",
  EXPIRED: "EXPIRED",
} as const;
export type VoucherStatus = (typeof VoucherStatus)[keyof typeof VoucherStatus];

export const SessionStatus = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED",
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

/** Default Wi-Fi plan presets for seeding and UI */
export const DEFAULT_WIFI_PLANS = [
  { name: "Free", durationMins: 30, speedMbps: 2, dataCapMb: 500, deviceLimit: 1, price: 0 },
  { name: "Basic", durationMins: 1440, speedMbps: 10, dataCapMb: 5000, deviceLimit: 1, price: 5 },
  { name: "Premium", durationMins: 10080, speedMbps: 25, dataCapMb: null, deviceLimit: 2, price: 15 },
  { name: "VIP", durationMins: 43200, speedMbps: 100, dataCapMb: null, deviceLimit: 5, price: 50 },
] as const;
