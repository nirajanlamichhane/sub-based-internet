import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import type { AuthUser } from "../../common/types/auth-user";
import { parseBody } from "../../common/utils/parse-body";
import { checkoutSchema } from "@sub-based-internet/shared/validators/billing";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("subscription")
  @UseGuards(TenantGuard)
  getSubscription(@CurrentUser() user: AuthUser) {
    return this.billingService.getSubscription(user.tenantId!);
  }

  @Post("checkout")
  @UseGuards(TenantGuard)
  createCheckout(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.billingService.createCheckoutSession(
      user.tenantId!,
      parseBody(checkoutSchema, body),
    );
  }

  @Post("portal")
  @UseGuards(TenantGuard)
  createPortal(@CurrentUser() user: AuthUser) {
    return this.billingService.createPortalSession(user.tenantId!);
  }

  @Public()
  @Post("webhook")
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error("Raw body required for Stripe webhook");
    }
    return this.billingService.handleWebhook(rawBody, signature);
  }
}
