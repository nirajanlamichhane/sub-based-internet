"use client";

import { useState } from "react";
import { DEFAULT_WIFI_PLANS } from "@sub-based-internet/shared/constants/enums";
import { formatDuration } from "@sub-based-internet/shared/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Alert, Spinner } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/lib/api-client";
import styles from "@/css/dashboard.module.css";
import ui from "@/css/ui.module.css";

export function PlansPage() {
  const locations = useAsyncData(() => apiClient.locations.list(), []);
  const plans = useAsyncData(() => apiClient.wifiPlans.list(), []);
  const [form, setForm] = useState({
    locationId: "",
    name: "Basic",
    durationMins: 1440,
    speedMbps: 10,
    price: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loading = locations.loading || plans.loading;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.wifiPlans.create({
        ...form,
        locationId: form.locationId || locs[0]?.id,
      });
      await plans.reload();
      setForm((f) => ({ ...f, name: "Basic", durationMins: 1440, speedMbps: 10, price: 5 }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this plan?")) return;
    await apiClient.wifiPlans.remove(id);
    await plans.reload();
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  const locs = locations.data ?? [];

  return (
    <>
      <h1 className={styles.pageTitle}>Wi-Fi Plans</h1>
      {formError && <Alert message={formError} />}
      <Card title="Create Plan">
        <form onSubmit={handleCreate}>
          <div className={ui.formGrid}>
            <Select
              label="Location"
              value={form.locationId || locs[0]?.id || ""}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              required
            >
              {locs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Select
              label="Preset"
              onChange={(e) => {
                const preset = DEFAULT_WIFI_PLANS.find((p) => p.name === e.target.value);
                if (preset) {
                  setForm({
                    ...form,
                    name: preset.name,
                    durationMins: preset.durationMins,
                    speedMbps: preset.speedMbps,
                    price: preset.price,
                  });
                }
              }}
            >
              {DEFAULT_WIFI_PLANS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Duration (mins)"
              type="number"
              value={form.durationMins}
              onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })}
              required
            />
            <Input
              label="Speed (Mbps)"
              type="number"
              value={form.speedMbps}
              onChange={(e) => setForm({ ...form, speedMbps: Number(e.target.value) })}
              required
            />
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
          <div className={ui.formActions}>
            <Button type="submit" disabled={submitting || locs.length === 0}>
              {submitting ? "Creating..." : "Create Plan"}
            </Button>
          </div>
        </form>
      </Card>
      <Card title="All Plans">
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "location", label: "Location" },
            { key: "duration", label: "Duration" },
            { key: "speed", label: "Speed" },
            { key: "price", label: "Price" },
            { key: "actions", label: "" },
          ]}
          rows={(plans.data ?? []).map((p) => ({
            name: p.name,
            location: p.location?.name ?? p.locationId,
            duration: formatDuration(p.durationMins),
            speed: `${p.speedMbps} Mbps`,
            price: `$${p.price}`,
            actions: (
              <Button variant="danger" onClick={() => handleDelete(p.id)}>
                Delete
              </Button>
            ),
          }))}
          emptyMessage="No plans yet"
        />
      </Card>
    </>
  );
}
