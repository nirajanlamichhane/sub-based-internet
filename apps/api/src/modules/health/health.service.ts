import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  checks: {
    database: "up" | "down";
    redis: "up" | "down";
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  check() {
    return { status: "ok" as const, timestamp: new Date().toISOString() };
  }

  async ready(): Promise<HealthStatus> {
    const checks = await this.runChecks();
    const allUp = checks.database === "up" && checks.redis === "up";
    const status = allUp ? "ok" : checks.database === "down" ? "error" : "degraded";

    if (status === "error") {
      throw new ServiceUnavailableException({
        status,
        timestamp: new Date().toISOString(),
        checks,
      });
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  async metrics() {
    const checks = await this.runChecks();
    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      checks,
    };
  }

  private async runChecks(): Promise<HealthStatus["checks"]> {
    let database: "up" | "down" = "down";
    let redis: "up" | "down" = "down";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }

    redis = (await this.redis.ping()) ? "up" : "down";

    return { database, redis };
  }
}
