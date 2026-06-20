import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import type { AuthUser } from "../../common/types/auth-user";
import { SessionsService } from "./sessions.service";

@Controller("sessions")
@UseGuards(TenantGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query("active") active?: string,
  ) {
    return this.sessionsService.findAll(user.tenantId!, active === "true");
  }

  @Post(":id/suspend")
  suspend(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.sessionsService.suspend(user.tenantId!, id);
  }
}
