import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { env } from "../../config/env";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { RateLimitGuard } from "../../common/guards/rate-limit.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { parseBody } from "../../common/utils/parse-body";
import type { AuthUser } from "../../common/types/auth-user";
import {
  createVouchersSchema,
  redeemVoucherSchema,
} from "@sub-based-internet/shared/validators/voucher";
import { VouchersService } from "./vouchers.service";

@Controller("vouchers")
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @UseGuards(TenantGuard)
  findAll(@CurrentUser() user: AuthUser, @Query("locationId") locationId?: string) {
    return this.vouchersService.findAll(user.tenantId!, locationId);
  }

  @Post()
  @UseGuards(TenantGuard)
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.vouchersService.createBatch(
      user.tenantId!,
      parseBody(createVouchersSchema, body),
    );
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: env.redeemRateLimit,
    windowSec: env.redeemRateWindowSec,
    keyPrefix: "redeem",
  })
  @Post("redeem")
  redeem(@Body() body: unknown) {
    return this.vouchersService.redeem(parseBody(redeemVoucherSchema, body));
  }

  @Get(":id/qr")
  @UseGuards(TenantGuard)
  @Header("Content-Type", "image/png")
  async qr(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.vouchersService.generateQrPng(user.tenantId!, id);
    res.send(buffer);
  }

  @Public()
  @Get(":token")
  findByToken(@Param("token") token: string) {
    return this.vouchersService.findByToken(token);
  }
}
