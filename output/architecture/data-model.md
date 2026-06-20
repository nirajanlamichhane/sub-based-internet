# Data Model

Living document — synced with `packages/db/prisma/schema.prisma`.

## Overview

Multi-tenant SaaS: every entity scoped by `tenantId` except platform-level admin users (`tenantId` is null).

**Schema status:** Implemented (task 002). Migration: `prisma/migrations/20250619120000_init/`.

## Enums

| Enum | Values |
|------|--------|
| `SaaSPlan` | STARTER, BUSINESS, ENTERPRISE |
| `LicenseStatus` | ACTIVE, GRACE, EXPIRED |
| `Role` | OWNER, STAFF, PLATFORM_ADMIN |
| `VoucherStatus` | ACTIVE, REDEEMED, EXPIRED |
| `SessionStatus` | ACTIVE, EXPIRED, SUSPENDED |

Shared TypeScript mirrors: `packages/shared/src/constants/enums.ts`.

## Entities

### Tenant

Venue owner organization (SaaS customer).

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| name | string | Business name |
| plan | SaaSPlan | Default STARTER |
| licenseStatus | LicenseStatus | Default ACTIVE |
| stripeCustomerId | string? | Stripe customer ID (unique) |
| stripeSubscriptionId | string? | Stripe subscription ID (unique) |
| subscriptionStatus | string? | Stripe status (active, past_due, …) |
| currentPeriodEnd | datetime? | Billing period end from Stripe |
| createdAt | datetime | Auto |
| updatedAt | datetime | Auto |

**SaaS tier limits:** Starter = 1 location, Business = 5, Enterprise = unlimited (`SAAS_PLAN_LOCATION_LIMITS` in shared).

### Location

Physical venue site with one gateway.

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| tenantId | string | FK → Tenant |
| name | string | Display name |
| slug | string | URL slug for captive portal |
| gatewayKey | string | Unique auth key for router agent |
| lastHeartbeatAt | datetime? | Updated by gateway heartbeat |
| createdAt | datetime | Auto |
| updatedAt | datetime | Auto |

**Unique:** `(tenantId, slug)`, `gatewayKey`

### User

Dashboard users (owners, staff, platform admins).

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| tenantId | string? | Null for platform admin |
| email | string | Unique login |
| passwordHash | string | bcrypt |
| role | Role | Default STAFF |
| createdAt | datetime | Auto |
| updatedAt | datetime | Auto |

### WifiPlan

Internet package definition per location.

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| locationId | string | FK → Location |
| name | string | Free, Basic, Premium, VIP |
| durationMins | int | Session length |
| speedMbps | int | Bandwidth cap |
| dataCapMb | int? | Null = unlimited |
| deviceLimit | int | Default 1 |
| price | decimal(10,2) | Default 0 |
| isActive | boolean | Default true |
| createdAt | datetime | Auto |
| updatedAt | datetime | Auto |

### Voucher

QR token for customer redemption.

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| token | string | Unique, encoded in QR |
| planId | string | FK → WifiPlan |
| locationId | string | FK → Location |
| status | VoucherStatus | Default ACTIVE |
| expiresAt | datetime | Token expiry |
| redeemedAt | datetime? | Set on redeem |
| redeemedMac | string? | Bound MAC address |
| createdAt | datetime | Auto |

### WifiSession

Active or historical customer connection.

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| voucherId | string? | FK → Voucher (nullable) |
| locationId | string | FK → Location |
| macAddress | string | Client device |
| ipAddress | string? | Assigned IP |
| speedMbps | int | Enforced limit |
| dataUsedMb | int | Default 0 |
| startedAt | datetime | Default now |
| expiresAt | datetime | Session end |
| status | SessionStatus | Default ACTIVE |

### AuditLog

Security and compliance trail.

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| tenantId | string? | Scoped tenant |
| action | string | e.g. VOUCHER_REDEEMED |
| entityType | string | e.g. Voucher |
| entityId | string | Related record ID |
| metadata | json? | Extra context |
| createdAt | datetime | Auto |

## Relationships

```text
Tenant 1──* Location 1──* WifiPlan
                │              │
                │              └──* Voucher ──* WifiSession
                └──* WifiSession
Tenant 1──* User
Tenant 1──* AuditLog
```

## Seed Data (dev)

| Entity | Value |
|--------|-------|
| Tenant | Demo Café Group (STARTER, ACTIVE) |
| Owner | owner@demo.com / password123 |
| Platform admin | admin@platform.com / password123 |
| Location | Downtown Café (`downtown-cafe`) |
| Gateway key | dev-gateway-key-downtown |
| Plans | Free, Basic, Premium, VIP (see `DEFAULT_WIFI_PLANS`) |
| Sample voucher | Generated on seed (printed to console) |

Run: `pnpm db:migrate:deploy && pnpm db:seed`

## DTO Types

Shared API/web DTOs: `packages/shared/src/types/entities.ts`
