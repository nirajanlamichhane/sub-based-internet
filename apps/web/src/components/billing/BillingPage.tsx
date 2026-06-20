"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge, Alert, Spinner } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/lib/api-client";
import { SaaSPlan } from "@sub-based-internet/shared/constants/enums";
import styles from "@/css/dashboard.module.css";

const UPGRADE_PLANS = [SaaSPlan.BUSINESS, SaaSPlan.ENTERPRISE] as const;

function licenseTone(status: string): "success" | "warning" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "GRACE") return "warning";
  return "danger";
}

export function BillingPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const esewaSuccess = searchParams.get("esewa") === "success";
  const khaltiSuccess = searchParams.get("khalti") === "success";
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsyncData(
    () => apiClient.billing.getSubscription(),
    [],
  );

  const openCheckout = useCallback(
    async (plan: string) => {
      setActionError(null);
      setBusy(plan);
      try {
        const { url } = await apiClient.billing.checkout(plan);
        window.location.href = url;
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Checkout failed");
        setBusy(null);
      }
    },
    [],
  );

  const openPortal = useCallback(async () => {
    setActionError(null);
    setBusy("portal");
    try {
      const { url } = await apiClient.billing.portal();
      window.location.href = url;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Portal failed");
      setBusy(null);
    }
  }, []);

  const payNepal = useCallback(
    async (plan: string, provider: "esewa" | "khalti") => {
      setActionError(null);
      setBusy(`${provider}-${plan}`);
      try {
        const init = await apiClient.billing.nepalInitiate(plan, provider);
        if (init.provider === "esewa" && init.formUrl && init.formData) {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = init.formUrl;
          for (const [key, value] of Object.entries(init.formData)) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          return;
        }
        if (init.provider === "khalti") {
          setActionError(
            "Khalti checkout requires Khalti.js on the frontend — use eSewa or contact support.",
          );
          setBusy(null);
        }
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Payment failed");
        setBusy(null);
      }
    },
    [],
  );

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <Alert message={error ?? "Failed to load billing"} />;
  }

  const limitLabel =
    data.locationLimit === null ? "Unlimited" : String(data.locationLimit);

  return (
    <>
      <h1 className={styles.pageTitle}>Billing</h1>

      {success && (
        <Alert message="Subscription updated successfully." tone="info" />
      )}
      {(esewaSuccess || khaltiSuccess) && (
        <Alert message="Nepal payment received — your plan will update shortly." tone="info" />
      )}
      {canceled && (
        <Alert message="Checkout canceled — no changes were made." />
      )}
      {actionError && <Alert message={actionError} />}

      <Card title="Your SaaS Plan">
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Current Plan</div>
            <div className={styles.statValue}>
              <Badge tone="success">{data.planLabel}</Badge>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Monthly Price</div>
            <div className={styles.statValue}>${data.monthlyUsd}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Locations</div>
            <div className={styles.statValue}>
              {data.locationCount} / {limitLabel}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>License</div>
            <div className={styles.statValue}>
              <Badge tone={licenseTone(data.licenseStatus)}>{data.licenseStatus}</Badge>
            </div>
          </div>
        </div>

        {data.currentPeriodEnd && (
          <p className={styles.billingNote}>
            Current period ends {new Date(data.currentPeriodEnd).toLocaleDateString()}
            {data.subscriptionStatus ? ` (${data.subscriptionStatus})` : ""}
          </p>
        )}

        <ul className={styles.billingList}>
          {data.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <div className={styles.billingActions}>
          {data.stripeConfigured ? (
            <>
              {data.hasSubscription && (
                <Button
                  onClick={openPortal}
                  disabled={busy !== null}
                  variant="secondary"
                >
                  {busy === "portal" ? "Opening…" : "Manage Subscription"}
                </Button>
              )}
              {UPGRADE_PLANS.filter((p) => p !== data.plan).map((plan) => (
                <Button
                  key={plan}
                  onClick={() => openCheckout(plan)}
                  disabled={busy !== null}
                >
                  {busy === plan ? "Redirecting…" : `Upgrade to ${plan}`}
                </Button>
              ))}
              {data.plan === SaaSPlan.STARTER && !data.hasSubscription && (
                <Button
                  onClick={() => openCheckout(SaaSPlan.STARTER)}
                  disabled={busy !== null}
                >
                  {busy === SaaSPlan.STARTER ? "Redirecting…" : "Subscribe"}
                </Button>
              )}
            </>
          ) : (
            <p className={styles.billingNote}>
              Stripe is not configured on this server. Contact your administrator to
              enable online billing.
            </p>
          )}
        </div>

        <Button variant="secondary" onClick={() => reload()} disabled={loading}>
          Refresh
        </Button>
      </Card>

      <Card title="Nepal payments (eSewa / Khalti)">
        <p className={styles.billingNote}>
          Pay in NPR via local wallets. Amounts follow USD plan pricing converted at checkout.
        </p>
        <div className={styles.billingActions}>
          {[SaaSPlan.STARTER, SaaSPlan.BUSINESS, SaaSPlan.ENTERPRISE].map((plan) => (
            <div key={plan} className={styles.methodRow}>
              <Button
                variant="secondary"
                onClick={() => payNepal(plan, "esewa")}
                disabled={busy !== null}
              >
                {busy === `esewa-${plan}` ? "Redirecting…" : `eSewa — ${plan}`}
              </Button>
              <Button
                variant="secondary"
                onClick={() => payNepal(plan, "khalti")}
                disabled={busy !== null}
              >
                {busy === `khalti-${plan}` ? "…" : `Khalti — ${plan}`}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
