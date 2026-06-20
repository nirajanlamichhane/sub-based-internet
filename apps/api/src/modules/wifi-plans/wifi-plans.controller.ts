import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { parseBody } from "../../common/utils/parse-body";
import type { AuthUser } from "../../common/types/auth-user";
import {
  createWifiPlanSchema,
  updateWifiPlanSchema,
} from "@sub-based-internet/shared/validators/wifi-plan";
import { WifiPlansService } from "./wifi-plans.service";

@Controller("wifi-plans")
@UseGuards(TenantGuard)
export class WifiPlansController {
  constructor(private readonly wifiPlansService: WifiPlansService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query("locationId") locationId?: string) {
    return this.wifiPlansService.findAll(user.tenantId!, locationId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.wifiPlansService.create(
      user.tenantId!,
      parseBody(createWifiPlanSchema, body),
    );
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.wifiPlansService.update(
      user.tenantId!,
      id,
      parseBody(updateWifiPlanSchema, body),
    );
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.wifiPlansService.remove(user.tenantId!, id);
  }
}
