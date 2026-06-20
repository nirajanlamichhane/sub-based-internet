import { describe, expect, it } from "vitest";
import { RedisLockService } from "./redis-lock.service";

describe("RedisLockService", () => {
  const service = new RedisLockService({} as never);

  it("generates stable voucher redeem lock keys", () => {
    expect(service.voucherRedeemLockKey("voucher-123")).toBe(
      "lock:voucher:redeem:voucher-123",
    );
  });

  it("uses unique keys per voucher", () => {
    const a = service.voucherRedeemLockKey("a");
    const b = service.voucherRedeemLockKey("b");
    expect(a).not.toBe(b);
  });
});
