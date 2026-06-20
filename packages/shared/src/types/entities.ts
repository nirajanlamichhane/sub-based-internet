import type {
  LicenseStatus,
  Role,
  SaaSPlan,
  SessionStatus,
  VoucherStatus,
} from "../constants/enums";

export interface TenantDto {
  id: string;
  name: string;
  plan: SaaSPlan;
  licenseStatus: LicenseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LocationDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  gatewayKey: string;
  lastHeartbeatAt: string | null;
}

export interface UserDto {
  id: string;
  tenantId: string | null;
  email: string;
  role: Role;
}

export interface WifiPlanDto {
  id: string;
  locationId: string;
  name: string;
  durationMins: number;
  speedMbps: number;
  dataCapMb: number | null;
  deviceLimit: number;
  price: number;
  isActive: boolean;
}

export interface VoucherDto {
  id: string;
  token: string;
  planId: string;
  locationId: string;
  status: VoucherStatus;
  expiresAt: string;
  redeemedAt: string | null;
  redeemedMac: string | null;
}

export interface WifiSessionDto {
  id: string;
  voucherId: string | null;
  locationId: string;
  macAddress: string;
  ipAddress: string | null;
  speedMbps: number;
  dataUsedMb: number;
  startedAt: string;
  expiresAt: string;
  status: SessionStatus;
}

export interface AuditLogDto {
  id: string;
  tenantId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
