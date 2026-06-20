import type { Role } from "@sub-based-internet/shared/constants/enums";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tenantId: string | null;
  type: "access" | "refresh";
}

export interface GatewayLocation {
  id: string;
  tenantId: string;
  slug: string;
  gatewayKey: string;
}
