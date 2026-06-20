# OpenWRT Venue Pilot Guide

Living document — venue hardware pilot for task 013.

## Overview

This guide walks through deploying the platform at a **real venue** using:

- **Cloud:** API + web (dashboard + captive portal) — already built
- **Venue:** OpenWRT router + gateway agent + captive portal redirect

```text
Guest phone ──WiFi──► OpenWRT router
                          │
              nodogsplash │ redirects unauthenticated HTTP
                          ▼
              https://your-domain.com/portal/{slug}?mac=…
                          │
              Gateway agent │ polls cloud, applies iptables + tc
                          ▼
              Allowed MAC gets internet at plan speed (Mbps)
```

## Prerequisites

### Cloud (before visiting the venue)

1. Deploy the cloud stack — see [production-deploy.md](./production-deploy.md).
2. Create a **location** in the owner dashboard (or via platform admin):
   - Note the **slug** (e.g. `downtown-cafe`) — used in portal URL
   - Copy the **gateway key** from Devices → location (or regenerate if needed)
3. Create at least one **Wi-Fi plan** and generate a test **voucher/QR**.
4. Confirm license is **ACTIVE** (Billing or platform admin).

### Hardware

| Item | Recommendation |
|------|----------------|
| Router | OpenWRT 23.x+ (x86/ARM), 128 MB+ RAM free |
| Storage | 64 MB+ free for Node.js (or run agent on a sidecar Pi) |
| WAN | Stable internet for cloud API polling |
| LAN | Guest WiFi SSID separate from staff network |

**Sidecar option:** If the router lacks RAM for Node.js, run the gateway agent on a Raspberry Pi on the same LAN. Set `GATEWAY_LAN_DEV` to the bridge interface that carries guest traffic.

### OpenWRT packages

Install via SSH on the router:

```sh
opkg update
opkg install nodogsplash iptables tc kmod-sched kmod-ifb curl
```

For Node.js on-router (optional — prefer sidecar if RAM is tight):

```sh
# Use OpenWRT Node package or install via nvm on sidecar
opkg install node npm
```

## Network topology

```text
                    ┌─────────────────┐
   Internet ◄──────│  OpenWRT router │
                    │  br-lan (guest) │
                    │  nodogsplash    │
                    │  gateway agent  │
                    └────────┬────────┘
                             │ WiFi
                        Guest devices
```

- Guest SSID → `br-lan` (or your guest bridge interface)
- Staff SSID → separate VLAN/bridge (no captive portal)

## Step 1 — Captive portal (nodogsplash)

nodogsplash is the simplest OpenWRT captive portal for MVP pilots.

### Configure nodogsplash

Edit `/etc/config/nodogsplash`:

```text
config nodogsplash
    option enabled '1'
    option gatewayinterface 'br-lan'
    option redirecturl 'https://your-domain.com/portal/YOUR-LOCATION-SLAG'
    option maxclients '250'
    option preauthidletimeout '3600'
    option authidletimeout '86400'
    option checkinterval '60'
```

Replace:
- `your-domain.com` — your production domain
- `YOUR-LOCATION-SLAG` — location slug from dashboard (e.g. `downtown-cafe`)

### Pass MAC and IP to the portal

nodogsplash supports URL variables. Update redirect to include client info:

```text
option redirecturl 'https://your-domain.com/portal/downtown-cafe?mac=$clientmac&ip=$clientip'
```

The captive portal reads `mac` from query params for voucher redeem + MAC binding.

### Firewall / DHCP

Ensure guest clients get DHCP and DNS through the router. nodogsplash intercepts port 80 until authenticated; HTTPS captive detection on some phones may require allowing DNS.

Restart nodogsplash:

```sh
/etc/init.d/nodogsplash restart
/etc/init.d/nodogsplash enable
```

### Authenticated clients (after redeem)

After a guest redeems a voucher, the **gateway agent** adds their MAC to iptables (`WIFI_SAAS` chain). nodogsplash may still block them until you either:

1. **Recommended for pilot:** Rely on gateway agent iptables FORWARD rules (agent allows MAC in `FORWARD` chain independent of nodogsplash), **or**
2. Call nodogsplash's `ndsctl auth MAC` from a hook (advanced — not in MVP)

For most pilots, configure nodogsplash with a **walled garden** allowing your portal domain:

```sh
# /etc/nodogsplash/nodogsplash.conf or UCI firewall rule
# Allow HTTPS to your cloud app before auth
iptables -I nds_filter -p tcp -d YOUR_CLOUD_IP --dport 443 -j ACCEPT
```

Add your cloud server IP so guests can load the portal before "full" auth.

## Step 2 — Install gateway agent

### Option A — Sidecar (recommended)

On a Raspberry Pi or small PC on the LAN:

```bash
# Clone repo or copy gateway/agent bundle
git clone <repo> && cd sub-based-internet
pnpm install
pnpm --filter @sub-based-internet/gateway-agent build
```

Copy `deploy/gateway-agent.env.example` to `/etc/wifi-saas/gateway.env` and fill in values (see below).

Run:

```bash
GATEWAY_DRIVER=openwrt GATEWAY_FAIL_FAST=1 node gateway/agent/dist/index.js
```

### Option B — On-router (OpenWRT)

Copy built agent + scripts to `/opt/wifi-saas/` on the router. Use the procd init script:

```sh
cp deploy/gateway-agent.procd /etc/init.d/wifi-saas-gateway
cp deploy/gateway-agent.env.example /etc/wifi-saas/gateway.env
# Edit /etc/wifi-saas/gateway.env
chmod +x /etc/init.d/wifi-saas-gateway
/etc/init.d/wifi-saas-gateway enable
/etc/init.d/wifi-saas-gateway start
```

### Gateway environment

See `deploy/gateway-agent.env.example`:

| Variable | Example | Notes |
|----------|---------|-------|
| `GATEWAY_API_URL` | `https://your-domain.com` | Production API URL (via nginx) |
| `GATEWAY_KEY` | From dashboard Devices page | Per-location secret |
| `GATEWAY_DRIVER` | `openwrt` | Required on hardware |
| `GATEWAY_LAN_DEV` | `br-lan` | Guest bridge interface |
| `GATEWAY_FAIL_FAST` | `1` | Fail loudly on script errors |
| `GATEWAY_POLL_MS` | `30000` | 30s session sync |
| `GATEWAY_FIRMWARE` | `openwrt-1.0.0` | Shown in dashboard |

**Dry run on laptop first:**

```bash
GATEWAY_DRIVER=openwrt GATEWAY_DRY_RUN=1 pnpm gateway:dev
```

## Step 3 — How enforcement works

On agent start (`OpenWrtDriver.initialize`):

1. `init-iptables.sh` — creates `WIFI_SAAS` chain, hooks into `FORWARD`
2. `init-tc.sh` — HTB qdisc on `GATEWAY_LAN_DEV`

For each active cloud session:

| Action | Script | Effect |
|--------|--------|--------|
| Allow | `allow-mac.sh` | iptables ACCEPT + tc class at `speedMbps` |
| Block | `block-mac.sh` | Remove rules when session expires |
| Shape | `shape-mac.sh` | Update rate if plan speed changes |

Usage bytes reported via `read-usage.sh` → `POST /gateway/usage`.

## Step 4 — Pilot verification checklist

Run these in order at the venue:

- [ ] **Cloud health:** `curl https://your-domain.com/health` → `{"status":"ok"}`
- [ ] **Gateway heartbeat:** Devices page shows "Gateway online" within 60s
- [ ] **Guest WiFi:** Phone connects to guest SSID, browser opens captive portal
- [ ] **Portal loads:** Terms + voucher entry visible at `/portal/{slug}`
- [ ] **Redeem:** Scan QR or enter code → "You are connected" + countdown
- [ ] **Internet:** Browse works on guest device
- [ ] **Dashboard:** Active session appears in Sessions with correct MAC
- [ ] **Speed cap:** Run speed test — result roughly matches plan `speedMbps` (± overhead)
- [ ] **Expiry:** Wait for session expiry (or suspend from dashboard) → access blocked on next poll (~30s)
- [ ] **Double redeem:** Same voucher rejected on second device

### Quick API checks (from laptop)

```bash
# Heartbeat (replace KEY)
curl -X POST https://your-domain.com/gateway/heartbeat \
  -H "X-Gateway-Key: YOUR_GATEWAY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"wanStatus":"up","firmwareVersion":"pilot-1.0"}'

# Active sessions
curl https://your-domain.com/gateway/sessions \
  -H "X-Gateway-Key: YOUR_GATEWAY_KEY"
```

## Step 5 — Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Devices page: no heartbeat | Wrong `GATEWAY_KEY` or API URL | Verify env; check router can reach cloud HTTPS |
| Portal doesn't open | nodogsplash not running / wrong interface | `logread \| grep nodogsplash`; check `gatewayinterface` |
| Portal loads but redeem fails | License expired or wrong slug | Check tenant license; match `locationSlug` |
| Redeem OK but no internet | iptables/tc scripts failed | Run with `GATEWAY_FAIL_FAST=1`; check `logread` |
| Internet but no speed cap | tc not on correct interface | Verify `GATEWAY_LAN_DEV`; run `tc qdisc show dev br-lan` |
| Session not in dashboard | API reachable but wrong location key | One key per location — regenerate if compromised |
| Agent crashes on start | Redis/cloud unreachable | Expected offline grace; fix WAN first |

### Useful commands on OpenWRT

```sh
# Check agent logs (procd)
logread | grep wifi-saas

# List allowed MACs
iptables -L WIFI_SAAS -n -v

# Check tc classes
tc class show dev br-lan

# Manual allow test (debug only)
sh /opt/wifi-saas/script/allow-mac.sh aa:bb:cc:dd:ee:ff 10
```

## Security notes

- **Rotate gateway key** if the router is compromised: Dashboard → Devices → regenerate key → update agent env → restart agent.
- Use **HTTPS only** for portal in production (required for modern captive portal detection).
- Keep guest WiFi **isolated** from staff LAN/VLAN.
- Gateway key is equivalent to router admin credentials — store in `/etc/wifi-saas/gateway.env` with `chmod 600`.

## Next steps after successful pilot

1. Stripe live billing for venue owners
2. Multiple locations per tenant (Business plan)
3. CoovaChilli for larger venues (more control than nodogsplash)
4. MikroTik driver (Phase 2+)

## Related docs

- [gateway-protocol.md](./gateway-protocol.md) — API contract and agent loop
- [production-deploy.md](./production-deploy.md) — Cloud deployment
- [api-contracts.md](./api-contracts.md) — REST endpoints
