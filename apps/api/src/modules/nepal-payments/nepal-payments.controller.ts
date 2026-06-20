import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import type { AuthUser } from "../../common/types/auth-user";
import { parseBody } from "../../common/utils/parse-body";
import {
  nepalPaymentInitSchema,
  khaltiVerifySchema,
} from "@sub-based-internet/shared/validators/nepal-payment";
import { NepalPaymentsService } from "./nepal-payments.service";

@Controller("billing/nepal")
export class NepalPaymentsController {
  constructor(private readonly nepalPayments: NepalPaymentsService) {}

  @Post("initiate")
  @UseGuards(TenantGuard)
  initiate(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.nepalPayments.initiate(user.tenantId!, parseBody(nepalPaymentInitSchema, body));
  }

  @Post("khalti/verify")
  @UseGuards(TenantGuard)
  verifyKhalti(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.nepalPayments.verifyKhalti(user.tenantId!, parseBody(khaltiVerifySchema, body));
  }

  @Public()
  @Get("esewa/callback")
  esewaCallback(@Query("paymentId") paymentId: string, @Query("status") status: string) {
    return this.nepalPayments.esewaCallback(paymentId, status);
  }
}
