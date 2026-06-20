import type { UserDto } from "@sub-based-internet/shared/types";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

export interface OverviewReport {
  activeSessions: number;
  totalSessions: number;
  activeVouchers: number;
  totalDataMb: number;
  locations: Array<{
    id: string;
    name: string;
    slug: string;
    lastHeartbeatAt: string | null;
  }>;
}

export interface SessionStatsReport {
  byHour: Array<{ hour: string; count: number }>;
  byPlan: Array<{ plan: string; count: number }>;
  total: number;
}

export interface WifiPlanWithLocation {
  id: string;
  locationId: string;
  name: string;
  durationMins: number;
  speedMbps: number;
  dataCapMb: number | null;
  deviceLimit: number;
  price: string | number;
  isActive: boolean;
  location?: { id: string; name: string; slug: string };
}

export interface VoucherWithRelations {
  id: string;
  token: string;
  planId: string;
  locationId: string;
  status: string;
  expiresAt: string;
  redeemedAt: string | null;
  redeemedMac: string | null;
  plan?: { id: string; name: string; speedMbps: number; durationMins: number };
  location?: { id: string; name: string; slug: string };
}

export interface SessionWithRelations {
  id: string;
  voucherId: string | null;
  locationId: string;
  macAddress: string;
  ipAddress: string | null;
  speedMbps: number;
  dataUsedMb: number;
  startedAt: string;
  expiresAt: string;
  status: string;
  location?: { id: string; name: string; slug: string };
  voucher?: { id: string; token: string };
}

export interface RedeemResponse {
  sessionId: string;
  expiresAt: string;
  speedMbps: number;
}

export interface SubscriptionInfo {
  plan: string;
  planLabel: string;
  monthlyUsd: number;
  features: string[];
  licenseStatus: string;
  locationLimit: number | null;
  locationCount: number;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  stripeConfigured: boolean;
  hasSubscription: boolean;
}

export interface VoucherLookup {
  id: string;
  token: string;
  status: string;
  expiresAt: string;
  plan?: { name: string; speedMbps: number; durationMins: number };
  location?: { name: string; slug: string };
}

export interface LocationRecord {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  gatewayKey: string;
  lastHeartbeatAt: string | null;
  createdAt?: string;
}
