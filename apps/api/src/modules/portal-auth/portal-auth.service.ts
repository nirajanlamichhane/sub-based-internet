import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { SessionStatus } from "@sub-based-internet/shared/constants/enums";
import {
  smsSendSchema,
  smsVerifySchema,
  type SmsSendInput,
  type SmsVerifyInput,
} from "@sub-based-internet/shared/validators/portal-sms";
import { randomInt } from "crypto";
import { env } from "../../config/env";
import { LicenseService } from "../../common/license/license.service";
import { MailService } from "../../common/mail/mail.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

@Injectable()
export class PortalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly license: LicenseService,
  ) {}

  async sendOtp(input: SmsSendInput) {
    const data = smsSendSchema.parse(input);
    const location = await this.prisma.location.findFirst({
      where: { slug: data.locationSlug },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }

    const license = await this.license.checkTenant(location.tenantId);
    if (!license.allowSessions) {
      throw new BadRequestException(license.message ?? "Venue license inactive");
    }

    const code = String(randomInt(100000, 999999));
    const phoneKey = data.phone.replace(/\D/g, "");
    await this.redis.setEx(`sms-otp:${phoneKey}`, code, env.smsOtpTtlSec);
    await this.mail.sendSmsOtp(phoneKey, code);

    const response: { message: string; devCode?: string } = {
      message: "Verification code sent.",
    };
    if (!env.smsProviderUrl && !env.isProduction) {
      response.devCode = code;
    }
    return response;
  }

  async verifyOtp(input: SmsVerifyInput) {
    const data = smsVerifySchema.parse(input);
    const phoneKey = data.phone.replace(/\D/g, "");
    const stored = await this.redis.get(`sms-otp:${phoneKey}`);

    if (!stored || stored !== data.code) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    const location = await this.prisma.location.findFirst({
      where: { slug: data.locationSlug },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }

    const expiresAt = new Date(Date.now() + env.smsSessionMins * 60 * 1000);
    const session = await this.prisma.wifiSession.create({
      data: {
        locationId: location.id,
        macAddress: data.macAddress.toLowerCase(),
        ipAddress: data.ipAddress ?? null,
        speedMbps: env.smsSessionSpeedMbps,
        expiresAt,
        status: SessionStatus.ACTIVE,
      },
    });

    await this.redis.del(`sms-otp:${phoneKey}`);

    return {
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString(),
      speedMbps: session.speedMbps,
    };
  }
}
