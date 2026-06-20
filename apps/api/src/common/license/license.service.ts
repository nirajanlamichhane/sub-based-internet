import { Injectable } from "@nestjs/common";
import { LicenseStatus } from "@sub-based-internet/shared/constants/enums";
import { PrismaService } from "../prisma/prisma.service";

export interface LicenseCheckResult {
  licenseStatus: LicenseStatus;
  allowSessions: boolean;
  warning: boolean;
  message?: string;
}

@Injectable()
export class LicenseService {
  constructor(private readonly prisma: PrismaService) {}

  async checkTenant(tenantId: string): Promise<LicenseCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { licenseStatus: true },
    });

    if (!tenant) {
      return {
        licenseStatus: LicenseStatus.EXPIRED,
        allowSessions: false,
        warning: false,
        message: "Tenant not found",
      };
    }

    const status = tenant.licenseStatus as LicenseStatus;

    if (status === LicenseStatus.EXPIRED) {
      return {
        licenseStatus: status,
        allowSessions: false,
        warning: false,
        message: "License expired — contact support to renew",
      };
    }

    if (status === LicenseStatus.GRACE) {
      return {
        licenseStatus: status,
        allowSessions: true,
        warning: true,
        message: "License in grace period — renew soon",
      };
    }

    return {
      licenseStatus: status,
      allowSessions: true,
      warning: false,
    };
  }
}
