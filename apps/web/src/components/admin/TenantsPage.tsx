"use client";

import { useState } from "react";
import {
  LicenseStatus,
  SaaSPlan,
  SAAS_PLAN_LOCATION_LIMITS,
} from "@sub-based-internet/shared/constants/enums";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Alert, Badge, Spinner } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/lib/api-client";
import type { TenantRecord } from "@/types/admin";
import styles from "@/css/dashboard.module.css";
import ui from "@/css/ui.module.css";

function licenseTone(status: string): "success" | "warning" | "danger" {
  if (status === LicenseStatus.ACTIVE) return "success";
  if (status === LicenseStatus.GRACE) return "warning";
  return "danger";
}

export function TenantsPage() {
  const { data, loading, error, reload } = useAsyncData(
    () => apiClient.tenants.list(),
    [],
  );
  const [edits, setEdits] = useState<
    Record<string, { plan: SaaSPlan; licenseStatus: LicenseStatus }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    plan: SaaSPlan.STARTER as SaaSPlan,
    licenseStatus: LicenseStatus.ACTIVE as LicenseStatus,
    ownerEmail: "",
    ownerPassword: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function editFor(tenant: TenantRecord) {
    return (
      edits[tenant.id] ?? {
        plan: tenant.plan,
        licenseStatus: tenant.licenseStatus,
      }
    );
  }

  function setEdit(
    tenant: TenantRecord,
    patch: Partial<{ plan: SaaSPlan; licenseStatus: LicenseStatus }>,
  ) {
    setEdits((prev) => ({
      ...prev,
      [tenant.id]: { ...editFor(tenant), ...patch },
    }));
  }

  async function handleSave(tenant: TenantRecord) {
    const edit = edits[tenant.id];
    if (!edit) return;

    setSavingId(tenant.id);
    setSaveError(null);
    try {
      await apiClient.tenants.update(tenant.id, {
        plan: edit.plan,
        licenseStatus: edit.licenseStatus,
      });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[tenant.id];
        return next;
      });
      await reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await apiClient.tenants.create({
        name: createForm.name,
        plan: createForm.plan,
        licenseStatus: createForm.licenseStatus,
        ownerEmail: createForm.ownerEmail || undefined,
        ownerPassword: createForm.ownerPassword || undefined,
      });
      setCreateForm({
        name: "",
        plan: SaaSPlan.STARTER,
        licenseStatus: LicenseStatus.ACTIVE,
        ownerEmail: "",
        ownerPassword: "",
      });
      await reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <Alert message={error} />;
  }

  const tenants = data ?? [];

  return (
    <>
      <h1 className={styles.pageTitle}>Tenants</h1>
      {saveError && <Alert message={saveError} />}

      <Card title="Create Tenant">
        {createError && <Alert message={createError} />}
        <form onSubmit={handleCreate}>
          <div className={ui.formGrid}>
            <Input
              label="Business name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <Select
              label="Plan"
              value={createForm.plan}
              onChange={(e) =>
                setCreateForm({ ...createForm, plan: e.target.value as SaaSPlan })
              }
            >
              {Object.values(SaaSPlan).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Select
              label="License"
              value={createForm.licenseStatus}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  licenseStatus: e.target.value as LicenseStatus,
                })
              }
            >
              {Object.values(LicenseStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input
              label="Owner email (optional)"
              type="email"
              value={createForm.ownerEmail}
              onChange={(e) =>
                setCreateForm({ ...createForm, ownerEmail: e.target.value })
              }
            />
            <Input
              label="Owner password (optional)"
              type="password"
              value={createForm.ownerPassword}
              onChange={(e) =>
                setCreateForm({ ...createForm, ownerPassword: e.target.value })
              }
              minLength={6}
            />
          </div>
          <div className={ui.formActions}>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create tenant"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title={`All tenants (${tenants.length})`}>
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "plan", label: "Plan" },
            { key: "license", label: "License" },
            { key: "usage", label: "Usage" },
            { key: "billing", label: "Billing" },
            { key: "actions", label: "Actions" },
          ]}
          rows={tenants.map((tenant) => {
            const edit = editFor(tenant);
            const limit = SAAS_PLAN_LOCATION_LIMITS[tenant.plan];
            const dirty =
              edit.plan !== tenant.plan || edit.licenseStatus !== tenant.licenseStatus;

            return {
              name: tenant.name,
              plan: (
                <Select
                  value={edit.plan}
                  onChange={(e) =>
                    setEdit(tenant, { plan: e.target.value as SaaSPlan })
                  }
                  aria-label={`Plan for ${tenant.name}`}
                >
                  {Object.values(SaaSPlan).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              ),
              license: (
                <Select
                  value={edit.licenseStatus}
                  onChange={(e) =>
                    setEdit(tenant, {
                      licenseStatus: e.target.value as LicenseStatus,
                    })
                  }
                  aria-label={`License for ${tenant.name}`}
                >
                  {Object.values(LicenseStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              ),
              usage: (
                <span>
                  {tenant._count.locations} / {limit ?? "∞"} locations ·{" "}
                  {tenant._count.users} users
                  <br />
                  <Badge tone={licenseTone(tenant.licenseStatus)}>
                    {tenant.licenseStatus}
                  </Badge>
                </span>
              ),
              billing: tenant.subscriptionStatus ? (
                <span className={styles.billingNote}>
                  {tenant.subscriptionStatus}
                  {tenant.currentPeriodEnd && (
                    <>
                      <br />
                      until {new Date(tenant.currentPeriodEnd).toLocaleDateString()}
                    </>
                  )}
                </span>
              ) : (
                <span className={styles.billingNote}>Manual</span>
              ),
              actions: (
                <Button
                  variant="secondary"
                  disabled={!dirty || savingId === tenant.id}
                  onClick={() => handleSave(tenant)}
                >
                  {savingId === tenant.id ? "Saving…" : "Save"}
                </Button>
              ),
            };
          })}
          emptyMessage="No tenants yet."
        />
      </Card>
    </>
  );
}
