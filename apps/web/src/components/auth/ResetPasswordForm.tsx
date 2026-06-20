"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@sub-based-internet/shared/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Badge";
import { apiClient } from "@/lib/api-client";
import styles from "@/css/login.module.css";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token. Use the link from your email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.auth.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.subtitle}>Choose a new password</p>
        {error && <Alert message={error} />}
        {done ? (
          <Alert message="Password updated. Redirecting to sign in…" tone="info" />
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Button type="submit" disabled={submitting || !token} className={styles.submitButton}>
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
        <p className={styles.footer}>
          <Link href="/login">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
