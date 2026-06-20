import { Suspense } from "react";
import { PortalPage } from "@/components/portal/PortalPage";
import { Spinner } from "@/components/ui/Badge";
import styles from "@/css/portal.module.css";

function PortalFallback() {
  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.loadingCenter}`}>
        <Spinner />
      </div>
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ locationSlug: string }>;
}) {
  const { locationSlug } = await params;

  return (
    <Suspense fallback={<PortalFallback />}>
      <PortalPage locationSlug={locationSlug} />
    </Suspense>
  );
}
