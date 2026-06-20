import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  check() {
    return this.healthService.check();
  }

  @Public()
  @Get("ready")
  async ready() {
    try {
      return await this.healthService.ready();
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException("Health check failed");
    }
  }

  @Public()
  @Get("metrics")
  metrics() {
    return this.healthService.metrics();
  }
}
