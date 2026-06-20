"use client";

import Link from "next/link";
import { useState } from "react";
import { APP_NAME } from "@sub-based-internet/shared/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Badge";
import { apiClient } from "@/lib/api-client";
import styles from "@/css/login.module.css";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);
    try {
      const res = await apiClient.auth.forgotPassword(email);
      setMessage(res.message);
      if (res.resetUrl) setDevResetUrl(res.resetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.subtitle}>Reset your password</p>
        {error && <Alert message={error} />}
        {message && <Alert message={message} tone="info" />}
        {devResetUrl && (
          <p className={styles.devLink}>
            Dev reset link: <Link href={devResetUrl.replace(/^https?:\/\/[^/]+/, "")}>open</Link>
          </p>
        )}
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button type="submit" disabled={submitting} className={styles.submitButton}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className={styles.footer}>
          <Link href="/login">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
