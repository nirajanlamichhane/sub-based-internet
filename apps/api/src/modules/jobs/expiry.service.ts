import { Injectable } from "@nestjs/common";
import { SessionStatus, VoucherStatus } from "@sub-based-internet/shared/constants/enums";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ExpiryService {
  constructor(private readonly prisma: PrismaService) {}

  async expireStaleRecords() {
    const now = new Date();

    const [sessions, vouchers] = await Promise.all([
      this.prisma.wifiSession.updateMany({
        where: {
          status: SessionStatus.ACTIVE,
          expiresAt: { lt: now },
        },
        data: { status: SessionStatus.EXPIRED },
      }),
      this.prisma.voucher.updateMany({
        where: {
          status: VoucherStatus.ACTIVE,
          expiresAt: { lt: now },
        },
        data: { status: VoucherStatus.EXPIRED },
      }),
    ]);

    if (sessions.count > 0 || vouchers.count > 0) {
      console.log(
        `[ExpiryService] expired ${sessions.count} session(s), ${vouchers.count} voucher(s)`,
      );
    }

    return { sessions: sessions.count, vouchers: vouchers.count };
  }
}
