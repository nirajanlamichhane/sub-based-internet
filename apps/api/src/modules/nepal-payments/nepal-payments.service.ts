import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  LicenseStatus,
  SaaSPlan,
} from "@sub-based-internet/shared/constants/enums";
import { SAAS_PLAN_PRICING } from "@sub-based-internet/shared/constants/billing";
import {
  nepalPaymentInitSchema,
  khaltiVerifySchema,
  type NepalPaymentInitInput,
  type KhaltiVerifyInput,
} from "@sub-based-internet/shared/validators/nepal-payment";
import { env } from "../../config/env";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class NepalPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async initiate(tenantId: string, input: NepalPaymentInitInput) {
    const data = nepalPaymentInitSchema.parse(input);
    const plan = data.plan as SaaSPlan;
    const amount = SAAS_PLAN_PRICING[plan].monthlyUsd;

    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        provider: data.provider,
        amount,
        plan,
        status: "pending",
      },
    });

    if (data.provider === "esewa") {
      return this.initiateEsewa(payment.id, amount, plan);
    }
    return this.initiateKhalti(payment.id, amount, plan);
  }

  private initiateEsewa(paymentId: string, amount: number, plan: SaaSPlan) {
    if (!env.esewaMerchantId && env.isProduction) {
      throw new ServiceUnavailableException("eSewa is not configured");
    }

    const taxAmount = 0;
    const serviceCharge = 0;
    const deliveryCharge = 0;
    const totalAmount = amount;
    const successUrl = `${env.webUrl}/dashboard/billing?esewa=success&paymentId=${paymentId}`;
    const failUrl = `${env.webUrl}/dashboard/billing?esewa=failed`;

    return {
      provider: "esewa",
      paymentId,
      plan,
      amount: totalAmount,
      formUrl: `${env.esewaApiUrl}/api/epay/main/v2/form`,
      formData: {
        amount: totalAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        transaction_uuid: paymentId,
        product_code: env.esewaProductCode,
        product_service_charge: serviceCharge,
        product_delivery_charge: deliveryCharge,
        success_url: successUrl,
        failure_url: failUrl,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: "configure-ESEWA_SECRET_KEY-for-production",
      },
    };
  }

  private initiateKhalti(paymentId: string, amount: number, plan: SaaSPlan) {
    if (!env.khaltiSecretKey && env.isProduction) {
      throw new ServiceUnavailableException("Khalti is not configured");
    }

    return {
      provider: "khalti",
      paymentId,
      plan,
      amount: amount * 100,
      khaltiPublicKey: env.khaltiSecretKey ? "configured" : "demo",
      verifyEndpoint: "/billing/nepal/khalti/verify",
      returnUrl: `${env.webUrl}/dashboard/billing?khalti=success&paymentId=${paymentId}`,
    };
  }

  async verifyKhalti(tenantId: string, input: KhaltiVerifyInput) {
    const data = khaltiVerifySchema.parse(input);
    const payment = await this.prisma.payment.findFirst({
      where: { id: data.paymentId, tenantId, provider: "khalti", status: "pending" },
    });
    if (!payment) {
      throw new BadRequestException("Payment not found");
    }

    if (env.khaltiSecretKey) {
      const res = await fetch(`${env.khaltiApiUrl}/payment/verify/`, {
        method: "POST",
        headers: {
          Authorization: `Key ${env.khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: data.token, amount: data.amount }),
      });
      if (!res.ok) {
        throw new BadRequestException("Khalti verification failed");
      }
    }

    await this.completePayment(payment.id, payment.tenantId, payment.plan as SaaSPlan, data.token);
    return { message: "Payment verified", plan: payment.plan };
  }

  async esewaCallback(paymentId: string, status: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.provider !== "esewa") {
      throw new BadRequestException("Invalid payment");
    }

    if (status === "success" || status === "COMPLETE") {
      await this.completePayment(payment.id, payment.tenantId, payment.plan as SaaSPlan, "esewa");
      return { message: "Payment complete", plan: payment.plan };
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: "failed" },
    });
    throw new BadRequestException("Payment failed");
  }

  private async completePayment(
    paymentId: string,
    tenantId: string,
    plan: SaaSPlan,
    externalRef: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: "completed", externalRef },
      }),
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { plan, licenseStatus: LicenseStatus.ACTIVE },
      }),
    ]);
  }
}
