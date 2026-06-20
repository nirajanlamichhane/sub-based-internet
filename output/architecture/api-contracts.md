# API Contracts

Living document — synced with NestJS implementation (task 003).

Base URL: `http://localhost:3001` (dev)

**Auth:** Bearer JWT for dashboard routes. `X-Gateway-Key` for gateway routes. `@Public()` routes skip JWT.

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Owner login → JWT |
| POST | `/auth/refresh` | Public | New access token |
| POST | `/auth/register` | Public | Register tenant + owner (dev/MVP) |

### Login Response

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "email": "...", "role": "OWNER", "tenantId": "..." }
}
```

## Tenants (Platform Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenants` | JWT + Platform Admin | List all tenants |
| POST | `/tenants` | JWT + Platform Admin | Create tenant |
| PATCH | `/tenants/:id` | JWT + Platform Admin | Update license/plan |

## Locations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/locations` | JWT + Tenant | List tenant locations |
| POST | `/locations` | JWT + Tenant | Create location |
| PATCH | `/locations/:id` | JWT + Tenant | Update location |
| POST | `/locations/:id/regenerate-gateway-key` | JWT + Tenant | Rotate gateway key |

## Wi-Fi Plans

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wifi-plans?locationId=` | JWT + Tenant | List plans |
| POST | `/wifi-plans` | JWT + Tenant | Create plan |
| PATCH | `/wifi-plans/:id` | JWT + Tenant | Update plan |
| DELETE | `/wifi-plans/:id` | JWT + Tenant | Delete plan |

## Vouchers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/vouchers?locationId=` | JWT + Tenant | List vouchers |
| POST | `/vouchers` | JWT + Tenant | Generate voucher(s) |
| GET | `/vouchers/:token` | Public | Lookup voucher by token |
| POST | `/vouchers/redeem` | Public | Redeem token → create session |
| GET | `/vouchers/:id/qr` | JWT + Tenant | QR code image (PNG) |

### Create Vouchers Request

```json
{
  "planId": "...",
  "locationId": "...",
  "count": 5,
  "expiresInHours": 168
}
```

### Redeem Request

```json
{
  "token": "ABC123XYZ",
  "macAddress": "aa:bb:cc:dd:ee:ff",
  "locationSlug": "downtown-cafe",
  "ipAddress": "192.168.1.50"
}
```

### Redeem Response

```json
{
  "sessionId": "clx...",
  "expiresAt": "2026-06-19T14:00:00.000Z",
  "speedMbps": 10
}
```

## Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sessions?active=true` | JWT + Tenant | List sessions |
| POST | `/sessions/:id/suspend` | JWT + Tenant | Suspend active session |

## Gateway

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/gateway/heartbeat` | X-Gateway-Key | License check + status |
| GET | `/gateway/sessions` | X-Gateway-Key | Active sessions for location |
| POST | `/gateway/usage` | X-Gateway-Key | Report bytes per session |

## Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reports/overview` | JWT + Tenant | Dashboard summary |
| GET | `/reports/sessions` | JWT + Tenant | Session stats by hour/plan |

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | API health check |

## Error Shape

```json
{
  "statusCode": 400,
  "message": "Human-readable message",
  "error": "Bad Request",
  "timestamp": "2026-06-19T12:00:00.000Z",
  "path": "/vouchers/redeem"
}
```

## Status

- **Implemented** — task 003 (NestJS modules in `apps/api/src/modules/`)
