"use client";

import { Card } from "@/components/ui/Card";
import { Alert, Spinner } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/lib/api-client";
import styles from "@/css/dashboard.module.css";

export function ReportsPage() {
  const stats = useAsyncData(() => apiClient.reports.sessions(), []);

  if (stats.loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  if (stats.error || !stats.data) {
    return <Alert message={stats.error ?? "Failed to load reports"} />;
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Reports</h1>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Sessions Analyzed</div>
          <div className={styles.statValue}>{stats.data.total}</div>
        </div>
      </div>
      <Card title="Sessions by Plan">
        <Table
          columns={[
            { key: "plan", label: "Plan" },
            { key: "count", label: "Sessions" },
          ]}
          rows={stats.data.byPlan.map((r) => ({
            plan: r.plan,
            count: r.count,
          }))}
          emptyMessage="No session data"
        />
      </Card>
      <Card title="Sessions by Hour">
        <Table
          columns={[
            { key: "hour", label: "Hour (UTC)" },
            { key: "count", label: "Sessions" },
          ]}
          rows={stats.data.byHour.slice(0, 24).map((r) => ({
            hour: r.hour,
            count: r.count,
          }))}
          emptyMessage="No hourly data"
        />
      </Card>
    </>
  );
}
