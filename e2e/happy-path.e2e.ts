/**
 * E2E happy-path test — runs against a live API (dev stack).
 *
 * Prerequisites:
 *   docker compose up -d
 *   pnpm db:migrate:deploy && pnpm db:seed
 *   pnpm dev  (API on :3001)
 */

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const GATEWAY_KEY = process.env.GATEWAY_KEY ?? "dev-gateway-key-downtown";
const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? "owner@demo.com";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "password123";
const LOCATION_SLUG = process.env.E2E_LOCATION_SLUG ?? "downtown-cafe";
const TEST_MAC = process.env.E2E_TEST_MAC ?? "aa:bb:cc:dd:ee:e2";

async function api<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

async function gateway<T>(path: string, init?: RequestInit): Promise<{ status: number; data: T }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Key": GATEWAY_KEY,
      ...(init?.headers as Record<string, string>),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

/** NestJS returns 201 for POST by default; accept any 2xx success. */
function expectSuccess(status: number) {
  expect(status).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(300);
}

describe("E2E happy path", () => {
  let accessToken: string;
  let locationId: string;
  let planId: string;
  let voucherToken: string;
  let sessionId: string;

  beforeAll(async () => {
    const health = await api<{ status: string }>("/health", { method: "GET" });
    if (health.status !== 200) {
      throw new Error(
        `API not reachable at ${API_URL} — start the stack with: docker compose up -d && pnpm db:migrate:deploy && pnpm db:seed && pnpm dev`,
      );
    }
  }, 15_000);

  it("1. owner can log in", async () => {
    const { status, data } = await api<{
      accessToken: string;
      user: { email: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
    });

    expectSuccess(status);
    expect(data.accessToken).toBeTruthy();
    accessToken = data.accessToken;
  });

  it("2. owner can list locations and plans", async () => {
    const locations = await api<Array<{ id: string; slug: string }>>("/locations", {
      token: accessToken,
    });
    expect(locations.status).toBe(200);
    expect(locations.data.length).toBeGreaterThan(0);

    const location = locations.data.find((l) => l.slug === LOCATION_SLUG) ?? locations.data[0];
    locationId = location.id;

    const plans = await api<Array<{ id: string; locationId: string }>>(
      `/wifi-plans?locationId=${locationId}`,
      { token: accessToken },
    );
    expect(plans.status).toBe(200);
    expect(plans.data.length).toBeGreaterThan(0);
    planId = plans.data[0].id;
  });

  it("3. owner can generate a voucher", async () => {
    const { status, data } = await api<Array<{ token: string }>>("/vouchers", {
      method: "POST",
      token: accessToken,
      body: JSON.stringify({
        planId,
        locationId,
        count: 1,
        expiresInHours: 168,
      }),
    });

    expectSuccess(status);
    expect(data[0]?.token).toBeTruthy();
    voucherToken = data[0].token;
  });

  it("4. customer can redeem voucher (captive portal flow)", async () => {
    const { status, data } = await api<{
      sessionId: string;
      expiresAt: string;
      speedMbps: number;
    }>("/vouchers/redeem", {
      method: "POST",
      body: JSON.stringify({
        token: voucherToken,
        macAddress: TEST_MAC,
        locationSlug: LOCATION_SLUG,
        ipAddress: "192.168.1.100",
      }),
    });

    expectSuccess(status);
    expect(data.sessionId).toBeTruthy();
    expect(data.speedMbps).toBeGreaterThan(0);
    sessionId = data.sessionId;
  });

  it("5. redeemed voucher cannot be used twice", async () => {
    const { status } = await api("/vouchers/redeem", {
      method: "POST",
      body: JSON.stringify({
        token: voucherToken,
        macAddress: TEST_MAC,
        locationSlug: LOCATION_SLUG,
      }),
    });
    expect(status).toBe(400);
  });

  it("6. session appears in owner dashboard", async () => {
    const { status, data } = await api<
      Array<{ id: string; macAddress: string; status: string }>
    >("/sessions?active=true", { token: accessToken });

    expectSuccess(status);
    const session = data.find((s) => s.id === sessionId);
    expect(session).toBeDefined();
    expect(session?.macAddress.toLowerCase()).toBe(TEST_MAC.toLowerCase());
    expect(session?.status).toBe("ACTIVE");
  });

  it("7. gateway poll returns active session", async () => {
    const heartbeat = await gateway<{
      licenseStatus: string;
      allowSessions?: boolean;
    }>("/gateway/heartbeat", {
      method: "POST",
      body: JSON.stringify({ wanStatus: "up", firmwareVersion: "e2e-1.0.0" }),
    });
    expectSuccess(heartbeat.status);
    expect(heartbeat.data.licenseStatus).toBe("ACTIVE");

    const sessions = await gateway<{
      sessions: Array<{ sessionId: string; macAddress: string }>;
    }>("/gateway/sessions");

    expect(sessions.status).toBe(200);
    const gwSession = sessions.data.sessions.find((s) => s.sessionId === sessionId);
    expect(gwSession).toBeDefined();
    expect(gwSession?.macAddress.toLowerCase()).toBe(TEST_MAC.toLowerCase());
  });

  it("8. owner can view billing subscription", async () => {
    const { status, data } = await api<{
      plan: string;
      planLabel: string;
      licenseStatus: string;
      locationCount: number;
      stripeConfigured: boolean;
    }>("/billing/subscription", { token: accessToken });

    expectSuccess(status);
    expect(data.plan).toBeTruthy();
    expect(data.planLabel).toBeTruthy();
    expect(data.licenseStatus).toBe("ACTIVE");
    expect(data.locationCount).toBeGreaterThan(0);
    expect(typeof data.stripeConfigured).toBe("boolean");
  });
});
