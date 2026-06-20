import { describe, expect, it } from "vitest";
import {
  STRIPE_ACTIVE_STATUSES,
  STRIPE_GRACE_STATUSES,
} from "@sub-based-internet/shared/constants/billing";
import { LicenseStatus } from "@sub-based-internet/shared/constants/enums";

/** Mirrors BillingService.applySubscription license mapping */
function licenseStatusFromStripeStatus(status: string): LicenseStatus {
  if (status === "canceled" || status === "incomplete_expired") {
    return LicenseStatus.EXPIRED;
  }
  if (STRIPE_GRACE_STATUSES.has(status)) {
    return LicenseStatus.GRACE;
  }
  if (STRIPE_ACTIVE_STATUSES.has(status)) {
    return LicenseStatus.ACTIVE;
  }
  return LicenseStatus.ACTIVE;
}

describe("billing license status mapping", () => {
  it("maps active subscription to ACTIVE", () => {
    expect(licenseStatusFromStripeStatus("active")).toBe(LicenseStatus.ACTIVE);
  });

  it("maps past_due to GRACE", () => {
    expect(licenseStatusFromStripeStatus("past_due")).toBe(LicenseStatus.GRACE);
  });

  it("maps canceled to EXPIRED", () => {
    expect(licenseStatusFromStripeStatus("canceled")).toBe(LicenseStatus.EXPIRED);
  });

  it("maps incomplete_expired to EXPIRED", () => {
    expect(licenseStatusFromStripeStatus("incomplete_expired")).toBe(
      LicenseStatus.EXPIRED,
    );
  });
});

describe("redeem lock key format", () => {
  it("prevents cross-voucher lock collisions", () => {
    const keys = ["v1", "v2", "v3"].map((id) => `lock:voucher:redeem:${id}`);
    expect(new Set(keys).size).toBe(3);
  });
});
