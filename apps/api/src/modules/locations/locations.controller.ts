import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { parseBody } from "../../common/utils/parse-body";
import type { AuthUser } from "../../common/types/auth-user";
import {
  createLocationSchema,
  updateLocationSchema,
} from "@sub-based-internet/shared/validators/location";
import { LocationsService } from "./locations.service";

@Controller("locations")
@UseGuards(TenantGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.locationsService.findAll(user.tenantId!);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.locationsService.create(user, parseBody(createLocationSchema, body));
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.locationsService.update(
      user.tenantId!,
      id,
      parseBody(updateLocationSchema, body),
    );
  }

  @Post(":id/regenerate-gateway-key")
  regenerateGatewayKey(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.locationsService.regenerateGatewayKey(user.tenantId!, id);
  }
}
