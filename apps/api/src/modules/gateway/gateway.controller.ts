import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { GatewayLocationCtx } from "../../common/decorators/gateway-location.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { GatewayKeyGuard } from "../../common/guards/gateway-key.guard";
import { parseBody } from "../../common/utils/parse-body";
import type { GatewayLocation } from "../../common/types/auth-user";
import {
  gatewayHeartbeatSchema,
  gatewayUsageSchema,
} from "@sub-based-internet/shared/validators/gateway";
import { GatewayService } from "./gateway.service";

@Controller("gateway")
@Public()
@UseGuards(GatewayKeyGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post("heartbeat")
  heartbeat(
    @GatewayLocationCtx() location: GatewayLocation,
    @Body() body: unknown,
  ) {
    return this.gatewayService.heartbeat(
      location,
      parseBody(gatewayHeartbeatSchema, body ?? {}),
    );
  }

  @Get("sessions")
  getSessions(@GatewayLocationCtx() location: GatewayLocation) {
    return this.gatewayService.getSessions(location);
  }

  @Post("usage")
  reportUsage(
    @GatewayLocationCtx() location: GatewayLocation,
    @Body() body: unknown,
  ) {
    return this.gatewayService.reportUsage(
      location,
      parseBody(gatewayUsageSchema, body),
    );
  }
}
