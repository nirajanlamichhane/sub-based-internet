"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "@/css/portal.module.css";

export function VoucherStep({
  token,
  macAddress,
  showMacInput,
  submitting,
  onTokenChange,
  onMacChange,
  onSubmit,
  onSmsClick,
}: {
  token: string;
  macAddress: string;
  showMacInput: boolean;
  submitting: boolean;
  onTokenChange: (v: string) => void;
  onMacChange: (v: string) => void;
  onSubmit: () => void;
  onSmsClick?: () => void;
}) {
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Enter Wi-Fi Pass</h1>
        <p className={styles.subtitle}>Use the code from your receipt or QR scan</p>
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Input
          label="Voucher code"
          value={token}
          onChange={(e) => onTokenChange(e.target.value.trim())}
          placeholder="Enter your code"
          required
          autoComplete="off"
        />

        {showMacInput && (
          <Input
            label="Device MAC address"
            value={macAddress}
            onChange={(e) => onMacChange(e.target.value)}
            placeholder="aa:bb:cc:dd:ee:ff"
            required
            autoComplete="off"
          />
        )}

        <Button type="submit" className={styles.fullWidth} disabled={submitting || !token}>
          {submitting ? "Connecting..." : "Connect"}
        </Button>
      </form>

      <p className={styles.hint}>
        {showMacInput
          ? "MAC not detected — enter manually for local testing"
          : "Your device has been identified automatically"}
        {onSmsClick && (
          <>
            {" · "}
            <button type="button" className={styles.linkButton} onClick={onSmsClick}>
              Sign in with phone
            </button>
          </>
        )}
      </p>
    </>
  );
}
