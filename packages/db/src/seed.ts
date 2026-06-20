import "./env";
import bcrypt from "bcryptjs";
import { prisma } from "./index";
import {
  DEFAULT_WIFI_PLANS,
  LicenseStatus,
  Role,
  SaaSPlan,
} from "@sub-based-internet/shared/constants/enums";
import { generateToken } from "@sub-based-internet/shared/utils";

const DEMO_OWNER_PASSWORD = "password123";
const DEMO_GATEWAY_KEY = "dev-gateway-key-downtown";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hashPassword(DEMO_OWNER_PASSWORD);

  const tenant = await prisma.tenant.upsert({
    where: { id: "seed-tenant-demo" },
    update: {},
    create: {
      id: "seed-tenant-demo",
      name: "Demo Café Group",
      plan: SaaSPlan.STARTER,
      licenseStatus: LicenseStatus.ACTIVE,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: { passwordHash },
    create: {
      email: "owner@demo.com",
      passwordHash,
      role: Role.OWNER,
      tenantId: tenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@platform.com" },
    update: { passwordHash },
    create: {
      email: "admin@platform.com",
      passwordHash,
      role: Role.PLATFORM_ADMIN,
      tenantId: null,
    },
  });

  const location = await prisma.location.upsert({
    where: { gatewayKey: DEMO_GATEWAY_KEY },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Downtown Café",
      slug: "downtown-cafe",
      gatewayKey: DEMO_GATEWAY_KEY,
    },
  });

  for (const plan of DEFAULT_WIFI_PLANS) {
    const planKey = `${location.id}-${plan.name.toLowerCase()}`;
    await prisma.wifiPlan.upsert({
      where: { id: planKey },
      update: {
        durationMins: plan.durationMins,
        speedMbps: plan.speedMbps,
        dataCapMb: plan.dataCapMb,
        deviceLimit: plan.deviceLimit,
        price: plan.price,
        isActive: true,
      },
      create: {
        id: planKey,
        locationId: location.id,
        name: plan.name,
        durationMins: plan.durationMins,
        speedMbps: plan.speedMbps,
        dataCapMb: plan.dataCapMb,
        deviceLimit: plan.deviceLimit,
        price: plan.price,
      },
    });
  }

  const freePlan = await prisma.wifiPlan.findFirst({
    where: { locationId: location.id, name: "Free" },
  });

  if (freePlan) {
    const sampleToken = generateToken(12);
    await prisma.voucher.upsert({
      where: { token: sampleToken },
      update: {},
      create: {
        token: sampleToken,
        planId: freePlan.id,
        locationId: location.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`Sample voucher token: ${sampleToken}`);
  }

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      action: "SEED_COMPLETED",
      entityType: "Tenant",
      entityId: tenant.id,
      metadata: { ownerEmail: owner.email, locationSlug: location.slug },
    },
  });

  console.log("Seed completed.");
  console.log("  Tenant:", tenant.name);
  console.log("  Owner: owner@demo.com /", DEMO_OWNER_PASSWORD);
  console.log("  Platform admin: admin@platform.com /", DEMO_OWNER_PASSWORD);
  console.log("  Location:", location.slug);
  console.log("  Gateway key:", DEMO_GATEWAY_KEY);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
