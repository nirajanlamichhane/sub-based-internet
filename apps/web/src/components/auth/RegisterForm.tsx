"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@sub-based-internet/shared/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Badge";
import { apiClient } from "@/lib/api-client";
import { setAuth } from "@/lib/auth-storage";
import { homePathForUser } from "@/lib/auth-redirect";
import styles from "@/css/login.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.auth.register(tenantName, email, password);
      setAuth(res.accessToken, res.refreshToken, res.user);
      router.push(homePathForUser(res.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.subtitle}>Create your venue owner account</p>
        {error && <Alert message={error} />}
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Business name"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            required
            autoComplete="organization"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <Button type="submit" disabled={submitting} className={styles.submitButton}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className={styles.footer}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
