import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import type { AuthUser } from "../../common/types/auth-user";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(TenantGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("overview")
  getOverview(@CurrentUser() user: AuthUser) {
    return this.reportsService.getOverview(user.tenantId!);
  }

  @Get("sessions")
  getSessionStats(@CurrentUser() user: AuthUser) {
    return this.reportsService.getSessionStats(user.tenantId!);
  }
}
