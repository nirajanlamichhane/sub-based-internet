import { Injectable } from "@nestjs/common";

import {

  gatewayHeartbeatSchema,

  gatewayUsageSchema,

  type GatewayHeartbeatInput,

  type GatewayUsageInput,

} from "@sub-based-internet/shared/validators/gateway";

import { LicenseService } from "../../common/license/license.service";

import { PrismaService } from "../../common/prisma/prisma.service";

import type { GatewayLocation } from "../../common/types/auth-user";

import { SessionStatus } from "@sub-based-internet/shared/constants/enums";



@Injectable()

export class GatewayService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly licenseService: LicenseService,

  ) {}



  async heartbeat(location: GatewayLocation, input: GatewayHeartbeatInput) {

    const data = gatewayHeartbeatSchema.parse(input);



    await this.prisma.location.update({

      where: { id: location.id },

      data: { lastHeartbeatAt: new Date() },

    });



    const license = await this.licenseService.checkTenant(location.tenantId);



    return {

      licenseStatus: license.licenseStatus,

      warning: license.warning,

      message: license.message,

      allowSessions: license.allowSessions,

      pollIntervalSeconds: 30,

      serverTime: new Date().toISOString(),

      wanStatus: data.wanStatus ?? "up",

    };

  }



  async getSessions(location: GatewayLocation) {

    const license = await this.licenseService.checkTenant(location.tenantId);



    if (!license.allowSessions) {

      return { sessions: [], licenseBlocked: true, message: license.message };

    }



    const sessions = await this.prisma.wifiSession.findMany({

      where: {

        locationId: location.id,

        status: SessionStatus.ACTIVE,

        expiresAt: { gt: new Date() },

      },

      select: {

        id: true,

        macAddress: true,

        ipAddress: true,

        speedMbps: true,

        expiresAt: true,

        status: true,

      },

    });



    return {

      sessions: sessions.map((s) => ({

        sessionId: s.id,

        macAddress: s.macAddress,

        ipAddress: s.ipAddress,

        speedMbps: s.speedMbps,

        expiresAt: s.expiresAt.toISOString(),

        status: s.status,

      })),

      licenseWarning: license.warning,

      message: license.message,

    };

  }



  async reportUsage(location: GatewayLocation, input: GatewayUsageInput) {

    const license = await this.licenseService.checkTenant(location.tenantId);

    if (!license.allowSessions) {

      return { received: 0, licenseBlocked: true };

    }



    const data = gatewayUsageSchema.parse(input);

    let suspended = 0;



    for (const report of data.reports) {

      const session = await this.prisma.wifiSession.findFirst({

        where: { id: report.sessionId, locationId: location.id },

        include: {

          voucher: { include: { plan: { select: { dataCapMb: true } } } },

        },

      });



      if (!session || session.status !== SessionStatus.ACTIVE) continue;



      const totalMb = Math.ceil((report.bytesIn + report.bytesOut) / (1024 * 1024));

      const newDataUsedMb = session.dataUsedMb + totalMb;

      const dataCapMb = session.voucher?.plan.dataCapMb ?? null;



      if (dataCapMb !== null && newDataUsedMb >= dataCapMb) {

        await this.prisma.wifiSession.update({

          where: { id: session.id },

          data: { dataUsedMb: newDataUsedMb, status: SessionStatus.SUSPENDED },

        });

        await this.prisma.auditLog.create({

          data: {

            tenantId: location.tenantId,

            action: "SESSION_DATA_CAP_EXCEEDED",

            entityType: "WifiSession",

            entityId: session.id,

            metadata: { dataUsedMb: newDataUsedMb, dataCapMb },

          },

        });

        suspended++;

        continue;

      }



      await this.prisma.wifiSession.update({

        where: { id: session.id },

        data: { dataUsedMb: newDataUsedMb },

      });

    }



    return { received: data.reports.length, suspended };

  }

}

