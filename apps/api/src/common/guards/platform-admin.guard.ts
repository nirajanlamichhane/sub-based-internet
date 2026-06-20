import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Role } from "@sub-based-internet/shared/constants/enums";
import type { AuthUser } from "../types/auth-user";

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;

    if (!user || user.role !== Role.PLATFORM_ADMIN) {
      throw new ForbiddenException("Platform admin access required");
    }

    return true;
  }
}
