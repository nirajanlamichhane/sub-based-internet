import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PlatformAdminGuard } from "../../common/guards/platform-admin.guard";
import { parseBody } from "../../common/utils/parse-body";
import {
  createTenantSchema,
  updateTenantSchema,
} from "@sub-based-internet/shared/validators/tenant";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
@UseGuards(PlatformAdminGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.tenantsService.create(parseBody(createTenantSchema, body));
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.tenantsService.update(id, parseBody(updateTenantSchema, body));
  }
}
