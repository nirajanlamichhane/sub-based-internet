import { Suspense } from "react";
import { BillingPage } from "@/components/billing/BillingPage";
import { Spinner } from "@/components/ui/Badge";

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <BillingPage />
    </Suspense>
  );
}
