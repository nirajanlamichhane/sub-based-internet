"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Badge";
import { apiClient } from "@/lib/api-client";
import { isValidMac, normalizeMac } from "@/script/portal";
import styles from "@/css/portal.module.css";

type Phase = "phone" | "code";

export function SmsStep({
  locationSlug,
  macAddress,
  showMacInput,
  ipAddress,
  onSuccess,
  onBack,
}: {
  locationSlug: string;
  macAddress: string;
  showMacInput: boolean;
  ipAddress?: string;
  onSuccess: (session: { sessionId: string; expiresAt: string; speedMbps: number }) => void;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [mac, setMac] = useState(macAddress);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.portal.sendSms(phone, locationSlug);
      if (res.devCode) setDevCode(res.devCode);
      setPhase("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const macNorm = normalizeMac(showMacInput ? mac : macAddress);
    if (!isValidMac(macNorm)) {
      setError("Please enter a valid MAC address (aa:bb:cc:dd:ee:ff).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await apiClient.portal.verifySms({
        phone,
        code,
        locationSlug,
        macAddress: macNorm,
        ipAddress,
      });
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Sign in with phone</h1>
        <p className={styles.subtitle}>We&apos;ll text you a one-time code</p>
      </div>

      {error && <Alert message={error} />}
      {devCode && (
        <p className={styles.hint}>Dev code: {devCode}</p>
      )}

      {phase === "phone" ? (
        <form className={styles.form} onSubmit={sendCode}>
          <Input
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98XXXXXXXX"
            required
            autoComplete="tel"
          />
          {showMacInput && (
            <Input
              label="Device MAC address"
              value={mac}
              onChange={(e) => setMac(normalizeMac(e.target.value))}
              placeholder="aa:bb:cc:dd:ee:ff"
              required
              autoComplete="off"
            />
          )}
          <Button type="submit" className={styles.fullWidth} disabled={submitting || phone.length < 10}>
            {submitting ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={verifyCode}>
          <Input
            label="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            required
            autoComplete="one-time-code"
          />
          <Button type="submit" className={styles.fullWidth} disabled={submitting || code.length !== 6}>
            {submitting ? "Verifying…" : "Connect"}
          </Button>
        </form>
      )}

      <p className={styles.hint}>
        <button type="button" className={styles.linkButton} onClick={onBack}>
          ← Use voucher instead
        </button>
      </p>
    </>
  );
}
