"use client";

import { Button } from "@/components/ui/Button";
import styles from "@/css/portal.module.css";

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <>
      <div className={styles.errorIcon} aria-hidden>
        ✕
      </div>
      <h1 className={styles.errorTitle}>Connection failed</h1>
      <p className={styles.errorMessage}>{message}</p>
      <div className={styles.actions}>
        <Button className={styles.fullWidth} onClick={onRetry}>
          Try again
        </Button>
      </div>
    </>
  );
}
