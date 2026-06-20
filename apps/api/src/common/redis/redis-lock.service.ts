import { Injectable } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Injectable()
export class RedisLockService {
  constructor(private readonly redis: RedisService) {}

  /** Acquire a short-lived lock (SETNX). Returns false if already held. */
  async acquire(key: string, ttlSeconds = 30): Promise<boolean> {
    return this.redis.setNx(key, ttlSeconds);
  }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }

  voucherRedeemLockKey(voucherId: string): string {
    return `lock:voucher:redeem:${voucherId}`;
  }
}
