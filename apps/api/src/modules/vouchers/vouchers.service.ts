import {

  BadRequestException,

  Injectable,

  NotFoundException,

} from "@nestjs/common";

import { SessionStatus, VoucherStatus } from "@sub-based-internet/shared/constants/enums";

import { generateToken } from "@sub-based-internet/shared/utils";

import {

  createVouchersSchema,

  redeemVoucherSchema,

  type CreateVouchersInput,

  type RedeemVoucherInput,

} from "@sub-based-internet/shared/validators/voucher";

import * as QRCode from "qrcode";

import { RedisLockService } from "../../common/redis/redis-lock.service";

import { LicenseService } from "../../common/license/license.service";

import { PrismaService } from "../../common/prisma/prisma.service";
import type { Prisma } from "@prisma/client";



@Injectable()

export class VouchersService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly redisLock: RedisLockService,

    private readonly license: LicenseService,

  ) {}



  findAll(tenantId: string, locationId?: string) {

    return this.prisma.voucher.findMany({

      where: {

        location: { tenantId },

        ...(locationId ? { locationId } : {}),

      },

      include: {

        plan: { select: { id: true, name: true, speedMbps: true, durationMins: true } },

        location: { select: { id: true, name: true, slug: true } },

      },

      orderBy: { createdAt: "desc" },

    });

  }



  async createBatch(tenantId: string, input: CreateVouchersInput) {

    const data = createVouchersSchema.parse(input);



    const plan = await this.prisma.wifiPlan.findFirst({

      where: { id: data.planId, locationId: data.locationId, location: { tenantId } },

    });

    if (!plan) {

      throw new NotFoundException("Plan or location not found");

    }



    const expiresAt = new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000);

    const vouchers = [];



    for (let i = 0; i < data.count; i++) {

      const voucher = await this.prisma.voucher.create({

        data: {

          token: generateToken(12),

          planId: data.planId,

          locationId: data.locationId,

          expiresAt,

        },

      });

      vouchers.push(voucher);



      await this.prisma.auditLog.create({

        data: {

          tenantId,

          action: "VOUCHER_CREATED",

          entityType: "Voucher",

          entityId: voucher.id,

        },

      });

    }



    return vouchers;

  }



  async findByToken(token: string) {

    const voucher = await this.prisma.voucher.findUnique({

      where: { token },

      include: {

        plan: { select: { name: true, speedMbps: true, durationMins: true } },

        location: { select: { name: true, slug: true } },

      },

    });



    if (!voucher) {

      throw new NotFoundException("Voucher not found");

    }



    return voucher;

  }



  async redeem(input: RedeemVoucherInput) {

    const data = redeemVoucherSchema.parse(input);



    const voucher = await this.prisma.voucher.findUnique({

      where: { token: data.token },

      include: { plan: true, location: true },

    });



    if (!voucher) {

      throw new NotFoundException("Voucher not found");

    }



    if (voucher.location.slug !== data.locationSlug) {

      throw new BadRequestException("Voucher not valid for this location");

    }



    const license = await this.license.checkTenant(voucher.location.tenantId);

    if (!license.allowSessions) {

      throw new BadRequestException(license.message ?? "Venue license inactive");

    }



    if (voucher.status === VoucherStatus.REDEEMED) {

      throw new BadRequestException("Voucher already redeemed");

    }



    if (voucher.status === VoucherStatus.EXPIRED || voucher.expiresAt < new Date()) {

      throw new BadRequestException("Voucher has expired");

    }



    const lockKey = this.redisLock.voucherRedeemLockKey(voucher.id);

    const acquired = await this.redisLock.acquire(lockKey, 30);

    if (!acquired) {

      throw new BadRequestException("Voucher already redeemed or redemption in progress");

    }



    try {

      const sessionExpiresAt = new Date(

        Date.now() + voucher.plan.durationMins * 60 * 1000,

      );



      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {

        const updated = await tx.voucher.updateMany({

          where: { id: voucher.id, status: VoucherStatus.ACTIVE },

          data: {

            status: VoucherStatus.REDEEMED,

            redeemedAt: new Date(),

            redeemedMac: data.macAddress,

          },

        });



        if (updated.count === 0) {

          throw new BadRequestException("Voucher already redeemed");

        }



        const session = await tx.wifiSession.create({

          data: {

            voucherId: voucher.id,

            locationId: voucher.locationId,

            macAddress: data.macAddress,

            ipAddress: data.ipAddress ?? null,

            speedMbps: voucher.plan.speedMbps,

            expiresAt: sessionExpiresAt,

            status: SessionStatus.ACTIVE,

          },

        });



        await tx.auditLog.create({

          data: {

            tenantId: voucher.location.tenantId,

            action: "VOUCHER_REDEEMED",

            entityType: "Voucher",

            entityId: voucher.id,

            metadata: { sessionId: session.id, macAddress: data.macAddress },

          },

        });



        return session;

      });



      return {

        sessionId: result.id,

        expiresAt: result.expiresAt.toISOString(),

        speedMbps: result.speedMbps,

      };

    } finally {

      await this.redisLock.release(lockKey);

    }

  }



  async generateQrPng(tenantId: string, id: string): Promise<Buffer> {

    const voucher = await this.prisma.voucher.findFirst({

      where: { id, location: { tenantId } },

    });



    if (!voucher) {

      throw new NotFoundException("Voucher not found");

    }



    return QRCode.toBuffer(voucher.token, { type: "png", width: 256 });

  }

}


