"use client";

import { Card } from "@/components/ui/Card";
import { Alert, Spinner } from "@/components/ui/Badge";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/lib/api-client";
import styles from "@/css/dashboard.module.css";

export function OverviewPage() {
  const { data, loading, error } = useAsyncData(() => apiClient.reports.overview(), []);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <Alert message={error ?? "Failed to load overview"} />;
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Overview</h1>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Sessions</div>
          <div className={styles.statValue}>{data.activeSessions}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Sessions</div>
          <div className={styles.statValue}>{data.totalSessions}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Vouchers</div>
          <div className={styles.statValue}>{data.activeVouchers}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Data Used (MB)</div>
          <div className={styles.statValue}>{data.totalDataMb}</div>
        </div>
      </div>
      <Card title="Locations">
        {data.locations.length === 0 ? (
          <p>No locations yet. Add one from Devices.</p>
        ) : (
          <ul>
            {data.locations.map((loc) => (
              <li key={loc.id}>
                {loc.name} ({loc.slug}) —{" "}
                {loc.lastHeartbeatAt ? "Gateway online" : "No heartbeat"}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
