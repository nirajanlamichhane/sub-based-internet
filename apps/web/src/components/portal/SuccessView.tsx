"use client";

import { useCountdown } from "@/hooks/useCountdown";
import styles from "@/css/portal.module.css";

export function SuccessView({
  speedMbps,
  expiresAt,
}: {
  speedMbps: number;
  expiresAt: string;
}) {
  const remaining = useCountdown(expiresAt);

  return (
    <>
      <div className={styles.successIcon} aria-hidden>
        ✓
      </div>
      <h1 className={styles.successTitle}>You&apos;re connected!</h1>
      <p className={styles.successDetail}>Internet access is active</p>
      <p className={styles.successDetail}>Speed: {speedMbps} Mbps</p>
      <div className={styles.countdown} aria-live="polite">
        {remaining}
      </div>
      <p className={styles.hint}>Time remaining on this session</p>
    </>
  );
}
