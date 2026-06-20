"use client";

import { Button } from "@/components/ui/Button";
import styles from "@/css/portal.module.css";

export function TermsStep({
  locationName,
  accepted,
  onAcceptChange,
  onContinue,
}: {
  locationName: string;
  accepted: boolean;
  onAcceptChange: (v: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.wifiIcon} aria-hidden>
          📶
        </div>
        <h1 className={styles.title}>Welcome to {locationName}</h1>
        <p className={styles.subtitle}>Connect to guest Wi-Fi</p>
      </div>

      <div className={styles.termsBox}>
        <p>
          By using this network you agree to acceptable use policies. Internet access is
          provided for lawful personal use only. Activity may be logged for security and
          billing. Do not share your access voucher with others.
        </p>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptChange(e.target.checked)}
        />
        <span>I accept the terms of service</span>
      </label>

      <Button
        className={styles.fullWidth}
        disabled={!accepted}
        onClick={onContinue}
      >
        Continue
      </Button>
    </>
  );
}
