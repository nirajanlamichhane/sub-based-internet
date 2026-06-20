import { getAccessToken } from "./auth-storage";
import type {
  AuthResponse,
  LocationRecord,
  OverviewReport,
  RedeemResponse,
  SessionStatsReport,
  SessionWithRelations,
  VoucherLookup,
  VoucherWithRelations,
  WifiPlanWithLocation,
} from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type FetchOptions = RequestInit & { auth?: boolean };

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
  },
};
