import { APP_NAME } from "@sub-based-internet/shared/constants";
import styles from "@/css/home.module.css";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>{APP_NAME}</h1>
      <p className={styles.subtitle}>Wi-Fi subscription management platform</p>
      <div className={styles.links}>
        <a href="/login" className={styles.link}>Owner Login</a>
        <a href="/dashboard" className={styles.link}>Dashboard</a>
      </div>
    </main>
  );
}
