"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, Badge, Spinner } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useAsyncData } from "@/hooks/useAsyncData";
import { apiClient } from "@/lib/api-client";
import styles from "@/css/dashboard.module.css";

function statusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "danger" as const;
  return "default" as const;
}

export function SessionsPage() {
  const sessions = useAsyncData(() => apiClient.sessions.list(), []);
  const [error, setError] = useState<string | null>(null);

  async function suspend(id: string) {
    setError(null);
    try {
      await apiClient.sessions.suspend(id);
      await sessions.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend session");
    }
  }

  if (sessions.loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Active Sessions</h1>
      {error && <Alert message={error} />}
      <Card title="All Sessions">
        <Table
          columns={[
            { key: "mac", label: "MAC" },
            { key: "location", label: "Location" },
            { key: "speed", label: "Speed" },
            { key: "status", label: "Status" },
            { key: "expires", label: "Expires" },
            { key: "actions", label: "" },
          ]}
          rows={(sessions.data ?? []).map((s) => ({
            mac: s.macAddress,
            location: s.location?.name ?? s.locationId,
            speed: `${s.speedMbps} Mbps`,
            status: <Badge tone={statusTone(s.status)}>{s.status}</Badge>,
            expires: new Date(s.expiresAt).toLocaleString(),
            actions:
              s.status === "ACTIVE" ? (
                <Button variant="danger" onClick={() => suspend(s.id)}>
                  Suspend
                </Button>
              ) : (
                "—"
              ),
          }))}
          emptyMessage="No sessions yet"
        />
      </Card>
    </>
  );
}