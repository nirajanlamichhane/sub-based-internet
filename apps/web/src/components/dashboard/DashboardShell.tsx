"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { APP_NAME } from "@sub-based-internet/shared/constants";
import { Role } from "@sub-based-internet/shared/constants/enums";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { homePathForUser } from "@/lib/auth-redirect";
import styles from "@/css/dashboard.module.css";
import { cn } from "@/script/cn";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/plans", label: "Wi-Fi Plans" },
  { href: "/dashboard/vouchers", label: "Vouchers" },
  { href: "/dashboard/sessions", label: "Sessions" },
  { href: "/dashboard/devices", label: "Devices" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === Role.PLATFORM_ADMIN) {
      router.replace("/admin");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role === Role.PLATFORM_ADMIN) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>{APP_NAME}</div>
        <div className={styles.brandSub}>Owner Dashboard</div>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                styles.navLink,
                pathname === item.href && styles.navLinkActive,
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.userBlock}>
          <div className={styles.userEmail}>{user.email}</div>
          <Button variant="secondary" onClick={() => { logout(); router.push("/login"); }}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
