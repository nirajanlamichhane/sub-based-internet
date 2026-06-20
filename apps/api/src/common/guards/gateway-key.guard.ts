import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { GatewayLocation } from "../types/auth-user";

@Injectable()
export class GatewayKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      gatewayLocation?: GatewayLocation;
    }>();

    const gatewayKey =
      request.headers["x-gateway-key"] ?? request.headers["X-Gateway-Key"];

    if (!gatewayKey) {
      throw new UnauthorizedException("Missing X-Gateway-Key header");
    }

    const location = await this.prisma.location.findUnique({
      where: { gatewayKey },
      select: { id: true, tenantId: true, slug: true, gatewayKey: true },
    });

    if (!location) {
      throw new UnauthorizedException("Invalid gateway key");
    }

    request.gatewayLocation = location;
    return true;
  }
}
