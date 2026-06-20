import styles from "@/css/ui.module.css";
import { cn } from "@/script/cn";

export function Input({
  className,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <input className={cn(styles.input, className)} {...props} />
    </label>
  );
}

export function Select({
  className,
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <select className={cn(styles.input, className)} {...props}>
        {children}
      </select>
    </label>
  );
}
