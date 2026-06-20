import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { env } from "../../config/env";

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    this.client = new Redis(env.redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    this.client.connect().catch((err) => {
      console.warn("[RedisService] connect failed — jobs/locks degraded:", err.message);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /** SET key NX with TTL — returns true if lock acquired */
  async setNx(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Fixed-window rate limit. Returns true if request is allowed.
   */
  async checkRateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, windowSec);
    }
    return count <= limit;
  }
}
