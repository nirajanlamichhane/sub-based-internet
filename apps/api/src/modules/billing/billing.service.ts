import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  LicenseStatus,
  SAAS_PLAN_LOCATION_LIMITS,
  SaaSPlan,
} from "@sub-based-internet/shared/constants/enums";
import {
  SAAS_PLAN_PRICING,
  STRIPE_ACTIVE_STATUSES,
  STRIPE_GRACE_STATUSES,
} from "@sub-based-internet/shared/constants/billing";
import type { CheckoutInput } from "@sub-based-internet/shared/validators/billing";
import Stripe from "stripe";
import { env } from "../../config/env";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (env.stripeSecretKey) {
      this.stripe = new Stripe(env.stripeSecretKey);
    }
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        "Stripe is not configured — set STRIPE_SECRET_KEY and price IDs",
      );
    }
    return this.stripe;
  }

  private priceIdForPlan(plan: SaaSPlan): string | null {
    const map: Record<SaaSPlan, string | undefined> = {
      [SaaSPlan.STARTER]: env.stripePriceStarter,
      [SaaSPlan.BUSINESS]: env.stripePriceBusiness,
      [SaaSPlan.ENTERPRISE]: env.stripePriceEnterprise,
    };
    return map[plan] ?? null;
  }

  private planFromPriceId(priceId: string): SaaSPlan | null {
    if (priceId === env.stripePriceStarter) return SaaSPlan.STARTER;
    if (priceId === env.stripePriceBusiness) return SaaSPlan.BUSINESS;
    if (priceId === env.stripePriceEnterprise) return SaaSPlan.ENTERPRISE;
    return null;
  }

  async getSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { _count: { select: { locations: true } } },
    });

    if (!tenant) throw new NotFoundException("Tenant not found");

    const plan = tenant.plan as SaaSPlan;
    const pricing = SAAS_PLAN_PRICING[plan];

    return {
      plan,
      planLabel: pricing.label,
      monthlyUsd: pricing.monthlyUsd,
      features: pricing.features,
      licenseStatus: tenant.licenseStatus,
      locationLimit: SAAS_PLAN_LOCATION_LIMITS[plan],
      locationCount: tenant._count.locations,
      subscriptionStatus: tenant.subscriptionStatus,
      currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() ?? null,
      stripeConfigured: this.isConfigured(),
      hasSubscription: Boolean(tenant.stripeSubscriptionId),
    };
  }

  async createCheckoutSession(tenantId: string, input: CheckoutInput) {
    const stripe = this.requireStripe();
    const priceId = this.priceIdForPlan(input.plan as SaaSPlan);
    if (!priceId) {
      throw new BadRequestException(`No Stripe price configured for plan ${input.plan}`);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { where: { role: "OWNER" }, take: 1 } },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const owner = tenant.users[0];
      const customer = await stripe.customers.create({
        email: owner?.email,
        name: tenant.name,
        metadata: { tenantId },
      });
      customerId = customer.id;
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.webUrl}/dashboard/billing?success=1`,
      cancel_url: `${env.webUrl}/dashboard/billing?canceled=1`,
      metadata: { tenantId, plan: input.plan },
      subscription_data: { metadata: { tenantId, plan: input.plan } },
    });

    if (!session.url) {
      throw new ServiceUnavailableException("Failed to create checkout session");
    }

    return { url: session.url };
  }

  async createPortalSession(tenantId: string) {
    const stripe = this.requireStripe();

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.stripeCustomerId) {
      throw new BadRequestException("No billing account — subscribe first");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${env.webUrl}/dashboard/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.requireStripe();
    if (!env.stripeWebhookSecret) {
      throw new ServiceUnavailableException("STRIPE_WEBHOOK_SECRET not configured");
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

    switch (event.type) {
      case "checkout.session.completed":
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await this.onSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await this.onPaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "invoice.paid":
        await this.onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
    }

    return { received: true };
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId;
    const plan = session.metadata?.plan as SaaSPlan | undefined;
    if (!tenantId || !plan) return;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan,
        licenseStatus: LicenseStatus.ACTIVE,
        stripeSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        subscriptionStatus: "active",
      },
    });
  }

  private async onSubscriptionChange(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!tenant) return;
      await this.applySubscription(tenant.id, subscription);
      return;
    }
    await this.applySubscription(tenantId, subscription);
  }

  private async applySubscription(tenantId: string, subscription: Stripe.Subscription) {
    const status = subscription.status;
    const priceId = subscription.items.data[0]?.price.id;
    const plan = priceId ? this.planFromPriceId(priceId) : null;

    let licenseStatus: LicenseStatus = LicenseStatus.ACTIVE;
    if (status === "canceled" || status === "incomplete_expired") {
      licenseStatus = LicenseStatus.EXPIRED;
    } else if (STRIPE_GRACE_STATUSES.has(status)) {
      licenseStatus = LicenseStatus.GRACE;
    } else if (STRIPE_ACTIVE_STATUSES.has(status)) {
      licenseStatus = LicenseStatus.ACTIVE;
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        licenseStatus,
        ...(plan ? { plan } : {}),
      },
    });
  }

  private async onPaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId =
      typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
    if (!subscriptionId) return;

    await this.prisma.tenant.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { licenseStatus: LicenseStatus.GRACE, subscriptionStatus: "past_due" },
    });
  }

  private async onInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId =
      typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
    if (!subscriptionId) return;

    await this.prisma.tenant.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { licenseStatus: LicenseStatus.ACTIVE, subscriptionStatus: "active" },
    });
  }
}
