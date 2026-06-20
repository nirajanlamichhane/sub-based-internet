"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Alert, Badge, Spinner } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/lib/api-client";
import styles from "@/css/dashboard.module.css";
import ui from "@/css/ui.module.css";

export function VouchersPage() {
  const locations = useAsyncData(() => apiClient.locations.list(), []);
  const plans = useAsyncData(() => apiClient.wifiPlans.list(), []);
  const vouchers = useAsyncData(() => apiClient.vouchers.list(), []);
  const [form, setForm] = useState({ planId: "", locationId: "", count: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
    };
  }, [qrUrl]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const locs = locations.data ?? [];
      const pls = plans.data ?? [];
      await apiClient.vouchers.create({
        planId: form.planId || pls[0]?.id,
        locationId: form.locationId || locs[0]?.id,
        count: form.count,
      });
      await vouchers.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vouchers");
    } finally {
      setSubmitting(false);
    }
  }

  async function showQr(id: string) {
    if (qrUrl) URL.revokeObjectURL(qrUrl);
    const blob = await apiClient.vouchers.qrBlob(id);
    setQrUrl(URL.createObjectURL(blob));
  }

  if (locations.loading || plans.loading || vouchers.loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  const locs = locations.data ?? [];
  const pls = plans.data ?? [];

  return (
    <>
      <h1 className={styles.pageTitle}>Vouchers & QR</h1>
      {error && <Alert message={error} />}
      <Card title="Generate Vouchers">
        <form onSubmit={handleCreate}>
          <div className={ui.formGrid}>
            <Select
              label="Location"
              value={form.locationId || locs[0]?.id || ""}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            >
              {locs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Select
              label="Plan"
              value={form.planId || pls[0]?.id || ""}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
            >
              {pls.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Input
              label="Count"
              type="number"
              min={1}
              max={100}
              value={form.count}
              onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
            />
          </div>
          <div className={ui.formActions}>
            <Button type="submit" disabled={submitting || !locs.length || !pls.length}>
              Generate
            </Button>
          </div>
        </form>
      </Card>
      {qrUrl && (
        <div className={styles.qrPreview}>
          <img src={qrUrl} alt="Voucher QR code" />
        </div>
      )}
      <Card title="Vouchers">
        <Table
          columns={[
            { key: "token", label: "Token" },
            { key: "plan", label: "Plan" },
            { key: "status", label: "Status" },
            { key: "expires", label: "Expires" },
            { key: "actions", label: "" },
          ]}
          rows={(vouchers.data ?? []).map((v) => ({
            token: <span className={styles.tokenMono}>{v.token}</span>,
            plan: v.plan?.name ?? v.planId,
            status: <Badge tone={v.status === "ACTIVE" ? "success" : "default"}>{v.status}</Badge>,
            expires: new Date(v.expiresAt).toLocaleString(),
            actions: (
              <Button variant="secondary" onClick={() => showQr(v.id)}>
                QR
              </Button>
            ),
          }))}
          emptyMessage="No vouchers yet"
        />
      </Card>
    </>
  );
}
