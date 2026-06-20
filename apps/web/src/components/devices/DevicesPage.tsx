"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert, Badge, Spinner } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/lib/api-client";
import styles from "@/css/dashboard.module.css";
import ui from "@/css/ui.module.css";

function gatewayStatus(lastHeartbeat: string | null) {
  if (!lastHeartbeat) return { label: "Offline", tone: "danger" as const };
  const age = Date.now() - new Date(lastHeartbeat).getTime();
  if (age < 60_000) return { label: "Online", tone: "success" as const };
  return { label: "Stale", tone: "warning" as const };
}

export function DevicesPage() {
  const locations = useAsyncData(() => apiClient.locations.list(), []);

  useEffect(() => {
    const id = setInterval(() => locations.reload(), 30_000);
    return () => clearInterval(id);
  }, [locations.reload]);

  const [form, setForm] = useState({ name: "", slug: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.locations.create(form);
      setForm({ name: "", slug: "" });
      await locations.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setSubmitting(false);
    }
  }

  if (locations.loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Devices & Locations</h1>
      {error && <Alert message={error} />}
      <Card title="Add Location">
        <form onSubmit={handleCreate}>
          <div className={ui.formGrid}>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Downtown Café"
              required
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                })
              }
              placeholder="downtown-cafe"
              required
            />
          </div>
          <div className={ui.formActions}>
            <Button type="submit" disabled={submitting}>
              Add Location
            </Button>
          </div>
        </form>
      </Card>
      <Card title="Gateway Status">
        <Table
          columns={[
            { key: "name", label: "Location" },
            { key: "slug", label: "Slug" },
            { key: "status", label: "Gateway" },
            { key: "heartbeat", label: "Last Heartbeat" },
          ]}
          rows={(locations.data ?? []).map((l) => {
            const st = gatewayStatus(l.lastHeartbeatAt);
            return {
              name: l.name,
              slug: l.slug,
              status: <Badge tone={st.tone}>{st.label}</Badge>,
              heartbeat: l.lastHeartbeatAt
                ? new Date(l.lastHeartbeatAt).toLocaleString()
                : "Never",
            };
          })}
          emptyMessage="No locations — add one above"
        />
      </Card>
    </>
  );
}
