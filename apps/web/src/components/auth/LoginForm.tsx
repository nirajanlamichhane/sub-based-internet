"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@sub-based-internet/shared/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { homePathForUser } from "@/lib/auth-redirect";
import styles from "@/css/login.module.css";

export function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("owner@demo.com");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    router.replace(homePathForUser(user));
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const loggedIn = await login(email, password);
      router.push(homePathForUser(loggedIn));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.subtitle}>Sign in to your owner dashboard</p>
        {error && <Alert message={error} />}
        <form className={styles.form} onSubmit={handleSubmit}>
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
            autoComplete="current-password"
          />
          <Button type="submit" disabled={submitting} className={styles.submitButton}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className={styles.footer}>
          <Link href="/forgot-password">Forgot password?</Link>
          {" · "}
          <Link href="/register">Create account</Link>
          {" · "}
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
