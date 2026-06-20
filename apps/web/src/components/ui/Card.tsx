import styles from "@/css/ui.module.css";
import { cn } from "@/script/cn";

export function Card({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn(styles.card, className)}>
      {(title || action) && (
        <header className={styles.cardHeader}>
          {title && <h2 className={styles.cardTitle}>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
