import { Injectable, NotFoundException } from "@nestjs/common";
import { SessionStatus } from "@sub-based-internet/shared/constants/enums";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, activeOnly?: boolean) {
    return this.prisma.wifiSession.findMany({
      where: {
        location: { tenantId },
        ...(activeOnly ? { status: SessionStatus.ACTIVE } : {}),
      },
      include: {
        location: { select: { id: true, name: true, slug: true } },
        voucher: { select: { id: true, token: true } },
      },
      orderBy: { startedAt: "desc" },
    });
  }

  async suspend(tenantId: string, id: string) {
    const session = await this.prisma.wifiSession.findFirst({
      where: { id, location: { tenantId } },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const updated = await this.prisma.wifiSession.update({
      where: { id },
      data: { status: SessionStatus.SUSPENDED },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: "SESSION_SUSPENDED",
        entityType: "WifiSession",
        entityId: id,
      },
    });

    return updated;
  }
}
