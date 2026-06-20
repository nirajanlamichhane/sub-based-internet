# Stripe Live Setup Guide

Living document — Stripe billing configuration for task 015.

## Overview

Venue owners subscribe via **Stripe Checkout** at `/dashboard/billing`. Webhooks sync plan + license status to the tenant record.

```text
Owner → Checkout → Stripe → webhook → API updates Tenant.plan + licenseStatus
Owner → Customer Portal → manage/cancel subscription
```

Use **test mode** first, then switch to live keys for production.

## Step 1 — Create Stripe account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete business verification for live mode (can defer — test mode works immediately)
3. Enable **Billing** → **Customer portal** in Dashboard settings

## Step 2 — Create products and prices

Dashboard → **Product catalog** → **Add product**

Create three recurring monthly products:

| Product | Suggested price | Env var |
|---------|-----------------|--------|
| Starter | $20 / month | `STRIPE_PRICE_STARTER` |
| Business | $79 / month | `STRIPE_PRICE_BUSINESS` |
| Enterprise | $199 / month | `STRIPE_PRICE_ENTERPRISE` |

For each product:

1. Add product name (e.g. "Wi-Fi SaaS Starter")
2. Pricing → **Recurring** → Monthly → set amount
3. Save and copy the **Price ID** (`price_...`)

## Step 3 — API keys

Dashboard → **Developers** → **API keys**

| Key | Env var | Notes |
|-----|---------|-------|
| Secret key | `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` |
| Publishable | *(not used by API)* | Web uses server-side Checkout only |

**Never commit secret keys.** Set only in `.env` on the server.

## Step 4 — Webhook endpoint

Dashboard → **Developers** → **Webhooks** → **Add endpoint**

| Field | Value |
|-------|-------|
| URL | `https://your-domain.com/billing/webhook` |
| Events | See list below |

**Required events:**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

Copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### Local testing

```bash
stripe login
stripe listen --forward-to localhost:3001/billing/webhook
# Copy whsec_ from CLI output → STRIPE_WEBHOOK_SECRET in .env
```

Restart API after changing webhook secret.

## Step 5 — Environment variables

Add to production `.env` (see `.env.production.example`):

```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
STRIPE_PRICE_STARTER=price_xxxxxxxx
STRIPE_PRICE_BUSINESS=price_xxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxx
```

Restart API:

```bash
docker compose -f docker-compose.prod.yml up -d api
```

## Step 6 — Customer portal settings

Dashboard → **Settings** → **Billing** → **Customer portal**

Enable:

- Cancel subscriptions
- Switch plans (if offering upgrades)
- Update payment methods

Return URL is set by API: `{WEB_URL}/dashboard/billing`

## Step 7 — Test the flow (test mode)

1. Login as venue owner: `owner@demo.com` (change password in production!)
2. Go to `/dashboard/billing`
3. Click **Subscribe** or **Upgrade to BUSINESS**
4. Stripe Checkout opens — use test card `4242 4242 4242 4242`, any future expiry, any CVC
5. Complete checkout → redirected to `/dashboard/billing?success=1`
6. Verify tenant plan updated in platform admin `/admin`

### Webhook verification

```bash
stripe trigger checkout.session.completed
# Or watch Dashboard → Webhooks → event log for 200 responses
```

### API check

```bash
TOKEN=$(curl -s -X POST https://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.com","password":"password123"}' | jq -r .accessToken)

curl -s https://your-domain.com/billing/subscription \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Expect `hasSubscription: true`, updated `plan`, `licenseStatus: "ACTIVE"`.

## License status mapping

| Stripe subscription status | Tenant `licenseStatus` |
|---------------------------|------------------------|
| `active`, `trialing` | ACTIVE |
| `past_due`, `unpaid` | GRACE |
| `canceled`, `incomplete_expired` | EXPIRED |

Failed invoice payment → `invoice.payment_failed` → GRACE (sessions still work during grace per license module).

## Go live checklist

- [ ] Switch `STRIPE_SECRET_KEY` to `sk_live_...`
- [ ] Create **live** products/prices (new `price_` IDs — test IDs don't work in live)
- [ ] Update `STRIPE_PRICE_*` with live price IDs
- [ ] Add **live** webhook endpoint with live signing secret
- [ ] Test one real subscription (small amount) then refund in Dashboard
- [ ] Change default seed passwords
- [ ] Confirm `WEB_URL` matches production HTTPS domain

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Checkout button 503 | `STRIPE_SECRET_KEY` or price IDs missing |
| Checkout works but plan unchanged | Webhook not reaching API — check URL, firewall, nginx `/billing/webhook` |
| Webhook 400 signature error | Wrong `STRIPE_WEBHOOK_SECRET`; must match endpoint |
| Portal 400 "No billing account" | Tenant has no `stripeCustomerId` — complete Checkout first |
| Double webhook processing | Idempotent updates — safe to retry; check Stripe event log |

## Without Stripe (manual licensing)

Platform admin can set plan/license at `/admin` without Stripe. Billing page shows "Stripe is not configured" and checkout is disabled. Suitable for pilots before billing is enabled.

## Related docs

- [production-deploy.md](./production-deploy.md) — Deploy API with Stripe env vars
- [api-contracts.md](./api-contracts.md) — Billing endpoints
