import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { env } from "../../config/env";

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  private connected = false;

  constructor() {
    this.client = new Redis(env.redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    this.client
      .connect()
      .then(() => {
        this.connected = true;
      })
      .catch((err) => {
        const msg = `[RedisService] connect failed — jobs/locks degraded: ${err.message}`;
        if (env.redisRequired) {
          console.error(msg);
          process.exit(1);
        }
        console.warn(msg);
      });
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client.status === "ready";
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

  async setEx(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
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
