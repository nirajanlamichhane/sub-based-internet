"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Badge";
import { apiClient } from "@/lib/api-client";
import type { RedeemResponse } from "@/types/auth";
import { isValidMac, mapRedeemError, normalizeMac } from "@/script/portal";
import styles from "@/css/portal.module.css";
import { ErrorView } from "./ErrorView";
import { SuccessView } from "./SuccessView";
import { TermsStep } from "./TermsStep";
import { VoucherStep } from "./VoucherStep";
import { SmsStep } from "./SmsStep";

type Step = "terms" | "voucher" | "sms" | "loading" | "success" | "error";

export function PortalPage({ locationSlug }: { locationSlug: string }) {
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token") ?? "";
  const queryMac = searchParams.get("mac") ?? "";
  const queryIp = searchParams.get("ip") ?? "";

  const [step, setStep] = useState<Step>("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [token, setToken] = useState(queryToken);
  const [mac, setMac] = useState(normalizeMac(queryMac));
  const [session, setSession] = useState<RedeemResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState(
    locationSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  );

  const showMacInput = !queryMac || !isValidMac(normalizeMac(queryMac));

  const effectiveMac = useMemo(() => {
    const m = normalizeMac(mac);
    return isValidMac(m) ? m : "";
  }, [mac]);

  const redeem = useCallback(
    async (voucherToken: string) => {
      if (!effectiveMac && showMacInput) {
        setError("Please enter a valid MAC address (aa:bb:cc:dd:ee:ff).");
        setStep("error");
        return;
      }

      const macAddress = effectiveMac || normalizeMac(queryMac);

      setStep("loading");
      setError(null);

      try {
        if (voucherToken !== token) {
          const lookup = await apiClient.portal.lookupVoucher(voucherToken);
          if (lookup.location?.name) setLocationName(lookup.location.name);
        }

        const result = await apiClient.portal.redeem({
          token: voucherToken,
          macAddress,
          locationSlug,
          ipAddress: queryIp || undefined,
        });

        setSession(result);
        setStep("success");
      } catch (err) {
        setError(mapRedeemError(err instanceof Error ? err.message : "Connection failed"));
        setStep("error");
      }
    },
    [effectiveMac, showMacInput, queryMac, queryIp, locationSlug, token],
  );

  const handleTermsContinue = useCallback(() => {
    if (queryToken) {
      setToken(queryToken);
      const macReady = !showMacInput || isValidMac(normalizeMac(mac));
      if (macReady) {
        redeem(queryToken);
      } else {
        setStep("voucher");
      }
    } else {
      setStep("voucher");
    }
  }, [queryToken, redeem, showMacInput, mac]);

  const handleRetry = useCallback(() => {
    setError(null);
    setStep(queryToken ? "terms" : "voucher");
    setTermsAccepted(false);
  }, [queryToken]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {step === "terms" && (
          <TermsStep
            locationName={locationName}
            accepted={termsAccepted}
            onAcceptChange={setTermsAccepted}
            onContinue={handleTermsContinue}
          />
        )}

        {step === "voucher" && (
          <VoucherStep
            token={token}
            macAddress={mac}
            showMacInput={showMacInput}
            submitting={false}
            onTokenChange={setToken}
            onMacChange={(v) => setMac(normalizeMac(v))}
            onSubmit={() => redeem(token)}
            onSmsClick={() => setStep("sms")}
          />
        )}

        {step === "sms" && (
          <SmsStep
            locationSlug={locationSlug}
            macAddress={mac}
            showMacInput={showMacInput}
            ipAddress={queryIp || undefined}
            onSuccess={(result) => {
              setSession(result);
              setStep("success");
            }}
            onBack={() => setStep("voucher")}
          />
        )}

        {step === "loading" && (
          <div className={styles.loadingCenter}>
            <Spinner />
          </div>
        )}

        {step === "success" && session && (
          <SuccessView speedMbps={session.speedMbps} expiresAt={session.expiresAt} />
        )}

        {step === "error" && error && (
          <ErrorView message={error} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
}
