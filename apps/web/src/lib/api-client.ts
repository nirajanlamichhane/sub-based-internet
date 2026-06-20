import { getAccessToken, getRefreshToken, setAuth, clearAuth } from "./auth-storage";
import type {
  AuthResponse,
  LocationRecord,
  OverviewReport,
  RedeemResponse,
  SessionStatsReport,
  SessionWithRelations,
  SubscriptionInfo,
  VoucherLookup,
  VoucherWithRelations,
  WifiPlanWithLocation,
} from "@/types/auth";
import type { TenantRecord } from "@/types/admin";

export interface NepalPaymentInitResponse {
  provider: "esewa" | "khalti";
  paymentId: string;
  plan: string;
  amount: number;
  formUrl?: string;
  formData?: Record<string, string | number>;
  khaltiPublicKey?: string;
  verifyEndpoint?: string;
  returnUrl?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type FetchOptions = RequestInit & { auth?: boolean; _retried?: boolean };

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as AuthResponse;
        setAuth(data.accessToken, data.refreshToken, data.user);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

function forceLoginRedirect() {
  clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join("; ") : String(body.message);
    }
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

async function fetchJson<T>(path: string, init?: FetchOptions): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (init?.auth !== false) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && init?.auth !== false && !init?._retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return fetchJson<T>(path, { ...init, _retried: true });
    }
    forceLoginRedirect();
  }

  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function fetchBlob(path: string): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.blob();
}

export const apiClient = {
  health: {
    check: () => fetchJson<{ status: string; timestamp: string }>("/health", { auth: false }),
  },

  auth: {
    login: (email: string, password: string) =>
      fetchJson<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
      }),
    register: (tenantName: string, email: string, password: string) =>
      fetchJson<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ tenantName, email, password }),
        auth: false,
      }),
    forgotPassword: (email: string) =>
      fetchJson<{ message: string; resetUrl?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        auth: false,
      }),
    resetPassword: (token: string, password: string) =>
      fetchJson<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        auth: false,
      }),
  },

  locations: {
    list: () => fetchJson<LocationRecord[]>("/locations"),
    create: (data: { name: string; slug: string }) =>
      fetchJson<LocationRecord>("/locations", { method: "POST", body: JSON.stringify(data) }),
  },

  wifiPlans: {
    list: (locationId?: string) =>
      fetchJson<WifiPlanWithLocation[]>(
        `/wifi-plans${locationId ? `?locationId=${locationId}` : ""}`,
      ),
    create: (data: {
      locationId: string;
      name: string;
      durationMins: number;
      speedMbps: number;
      dataCapMb?: number | null;
      deviceLimit?: number;
      price?: number;
    }) => fetchJson<WifiPlanWithLocation>("/wifi-plans", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchJson<WifiPlanWithLocation>(`/wifi-plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: string) => fetchJson<void>(`/wifi-plans/${id}`, { method: "DELETE" }),
  },

  vouchers: {
    list: (locationId?: string) =>
      fetchJson<VoucherWithRelations[]>(
        `/vouchers${locationId ? `?locationId=${locationId}` : ""}`,
      ),
    create: (data: {
      planId: string;
      locationId: string;
      count?: number;
      expiresInHours?: number;
    }) => fetchJson<VoucherWithRelations[]>("/vouchers", { method: "POST", body: JSON.stringify(data) }),
    qrBlob: (id: string) => fetchBlob(`/vouchers/${id}/qr`),
  },

  sessions: {
    list: (activeOnly?: boolean) =>
      fetchJson<SessionWithRelations[]>(
        `/sessions${activeOnly ? "?active=true" : ""}`,
      ),
    suspend: (id: string) =>
      fetchJson<SessionWithRelations>(`/sessions/${id}/suspend`, { method: "POST" }),
  },

  reports: {
    overview: () => fetchJson<OverviewReport>("/reports/overview"),
    sessions: () => fetchJson<SessionStatsReport>("/reports/sessions"),
  },

  tenants: {
    list: () => fetchJson<TenantRecord[]>("/tenants"),
    create: (data: {
      name: string;
      plan?: string;
      licenseStatus?: string;
      ownerEmail?: string;
      ownerPassword?: string;
    }) => fetchJson<TenantRecord>("/tenants", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; plan?: string; licenseStatus?: string }) =>
      fetchJson<TenantRecord>(`/tenants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  portal: {
    lookupVoucher: (token: string) =>
      fetchJson<VoucherLookup>(`/vouchers/${encodeURIComponent(token)}`, { auth: false }),
    redeem: (data: {
      token: string;
      macAddress: string;
      locationSlug: string;
      ipAddress?: string;
    }) =>
      fetchJson<RedeemResponse>("/vouchers/redeem", {
        method: "POST",
        body: JSON.stringify(data),
        auth: false,
      }),
    sendSms: (phone: string, locationSlug: string) =>
      fetchJson<{ message: string; devCode?: string }>("/portal/sms/send", {
        method: "POST",
        body: JSON.stringify({ phone, locationSlug }),
        auth: false,
      }),
    verifySms: (data: {
      phone: string;
      code: string;
      locationSlug: string;
      macAddress: string;
      ipAddress?: string;
    }) =>
      fetchJson<RedeemResponse>("/portal/sms/verify", {
        method: "POST",
        body: JSON.stringify(data),
        auth: false,
      }),
  },

  billing: {
    getSubscription: () =>
      fetchJson<SubscriptionInfo>("/billing/subscription"),
    checkout: (plan: string) =>
      fetchJson<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    portal: () =>
      fetchJson<{ url: string }>("/billing/portal", { method: "POST" }),
    nepalInitiate: (plan: string, provider: "esewa" | "khalti") =>
      fetchJson<NepalPaymentInitResponse>("/billing/nepal/initiate", {
        method: "POST",
        body: JSON.stringify({ plan, provider }),
      }),
    nepalVerifyKhalti: (token: string, amount: number, paymentId: string) =>
      fetchJson<{ message: string; plan: string }>("/billing/nepal/khalti/verify", {
        method: "POST",
        body: JSON.stringify({ token, amount, paymentId }),
      }),
  },
};
