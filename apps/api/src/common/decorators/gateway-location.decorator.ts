import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { GatewayLocation } from "../types/auth-user";

export const GatewayLocationCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GatewayLocation => {
    const request = ctx.switchToHttp().getRequest<{ gatewayLocation: GatewayLocation }>();
    return request.gatewayLocation;
  },
);
