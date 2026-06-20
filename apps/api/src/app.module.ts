import { Module } from "@nestjs/common";

import { APP_FILTER, APP_GUARD } from "@nestjs/core";

import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";

import { RateLimitGuard } from "./common/guards/rate-limit.guard";

import { LicenseModule } from "./common/license/license.module";

import { MailModule } from "./common/mail/mail.module";

import { PrismaModule } from "./common/prisma/prisma.module";

import { RedisModule } from "./common/redis/redis.module";

import { AuthModule } from "./modules/auth/auth.module";

import { GatewayModule } from "./modules/gateway/gateway.module";

import { HealthModule } from "./modules/health/health.module";

import { JobsModule } from "./modules/jobs/jobs.module";

import { LocationsModule } from "./modules/locations/locations.module";

import { ReportsModule } from "./modules/reports/reports.module";

import { BillingModule } from "./modules/billing/billing.module";

import { NepalPaymentsModule } from "./modules/nepal-payments/nepal-payments.module";

import { PortalAuthModule } from "./modules/portal-auth/portal-auth.module";

import { SessionsModule } from "./modules/sessions/sessions.module";

import { TenantsModule } from "./modules/tenants/tenants.module";

import { VouchersModule } from "./modules/vouchers/vouchers.module";

import { WifiPlansModule } from "./modules/wifi-plans/wifi-plans.module";



@Module({

  imports: [

    PrismaModule,

    RedisModule,

    MailModule,

    LicenseModule,

    JobsModule,

    AuthModule,

    HealthModule,

    TenantsModule,

    LocationsModule,

    WifiPlansModule,

    VouchersModule,

    SessionsModule,

    GatewayModule,

    ReportsModule,

    BillingModule,

    NepalPaymentsModule,

    PortalAuthModule,

  ],

  providers: [

    { provide: APP_GUARD, useClass: JwtAuthGuard },

    { provide: APP_GUARD, useClass: RateLimitGuard },

    { provide: APP_FILTER, useClass: HttpExceptionFilter },

  ],

})

export class AppModule {}


