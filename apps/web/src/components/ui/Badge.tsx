import styles from "@/css/ui.module.css";
import { cn } from "@/script/cn";

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return <span className={cn(styles.badge, styles[`badge_${tone}`])}>{children}</span>;
}

export function Alert({ message, tone = "error" }: { message: string; tone?: "error" | "info" }) {
  return <div className={cn(styles.alert, styles[`alert_${tone}`])}>{message}</div>;
}

export function Spinner() {
  return <div className={styles.spinner} aria-label="Loading" />;
}
