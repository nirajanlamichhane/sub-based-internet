import { Injectable } from "@nestjs/common";
import { SessionStatus, VoucherStatus } from "@sub-based-internet/shared/constants/enums";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const [activeSessions, totalSessions, activeVouchers, locations] =
      await Promise.all([
        this.prisma.wifiSession.count({
          where: {
            location: { tenantId },
            status: SessionStatus.ACTIVE,
            expiresAt: { gt: new Date() },
          },
        }),
        this.prisma.wifiSession.count({
          where: { location: { tenantId } },
        }),
        this.prisma.voucher.count({
          where: {
            location: { tenantId },
            status: VoucherStatus.ACTIVE,
            expiresAt: { gt: new Date() },
          },
        }),
        this.prisma.location.findMany({
          where: { tenantId },
          select: {
            id: true,
            name: true,
            slug: true,
            lastHeartbeatAt: true,
          },
        }),
      ]);

    const totalDataMb = await this.prisma.wifiSession.aggregate({
      where: { location: { tenantId } },
      _sum: { dataUsedMb: true },
    });

    return {
      activeSessions,
      totalSessions,
      activeVouchers,
      totalDataMb: totalDataMb._sum.dataUsedMb ?? 0,
      locations,
    };
  }

  async getSessionStats(tenantId: string) {
    const sessions = await this.prisma.wifiSession.findMany({
      where: { location: { tenantId } },
      select: {
        startedAt: true,
        status: true,
        voucher: {
          select: { plan: { select: { name: true } } },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 500,
    });

    const byHour: Record<string, number> = {};
    const byPlan: Record<string, number> = {};

    for (const session of sessions) {
      const hour = session.startedAt.toISOString().slice(0, 13);
      byHour[hour] = (byHour[hour] ?? 0) + 1;

      const planName = session.voucher?.plan?.name ?? "Direct";
      byPlan[planName] = (byPlan[planName] ?? 0) + 1;
    }

    return {
      byHour: Object.entries(byHour).map(([hour, count]) => ({ hour, count })),
      byPlan: Object.entries(byPlan).map(([plan, count]) => ({ plan, count })),
      total: sessions.length,
    };
  }
}
