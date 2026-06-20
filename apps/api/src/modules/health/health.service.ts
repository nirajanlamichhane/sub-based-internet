import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  check() {
    return { status: "ok" as const, timestamp: new Date().toISOString() };
  }
}
