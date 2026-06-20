"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import styles from "@/css/dashboard.module.css";

export function BillingPage() {
  return (
    <>
      <h1 className={styles.pageTitle}>Billing</h1>
      <Card title="Your SaaS Plan">
        <p className={styles.billingNote}>
          Subscription billing for venue owners. Payment integration coming in Phase 2.
        </p>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Current Plan</div>
            <div className={styles.statValue}>
              <Badge tone="success">Starter</Badge>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Monthly Price</div>
            <div className={styles.statValue}>$20</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Location Limit</div>
            <div className={styles.statValue}>1</div>
          </div>
        </div>
        <ul className={styles.billingList}>
          <li>Captive portal & QR vouchers</li>
          <li>User management & analytics</li>
          <li>Speed control & remote monitoring</li>
        </ul>
      </Card>
    </>
  );
}
