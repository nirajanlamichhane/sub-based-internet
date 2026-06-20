import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  SAAS_PLAN_LOCATION_LIMITS,
  type SaaSPlan,
} from "@sub-based-internet/shared/constants/enums";
import { generateToken } from "@sub-based-internet/shared/utils";
import {
  createLocationSchema,
  updateLocationSchema,
  type CreateLocationInput,
  type UpdateLocationInput,
} from "@sub-based-internet/shared/validators/location";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/types/auth-user";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.location.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(user: AuthUser, input: CreateLocationInput) {
    const data = createLocationSchema.parse(input);
    const tenantId = user.tenantId!;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { _count: { select: { locations: true } } },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const limit = SAAS_PLAN_LOCATION_LIMITS[tenant.plan as SaaSPlan];
    if (limit !== null && tenant._count.locations >= limit) {
      throw new ForbiddenException(`Location limit reached for ${tenant.plan} plan`);
    }

    const existingSlug = await this.prisma.location.findFirst({
      where: { tenantId, slug: data.slug },
    });
    if (existingSlug) {
      throw new BadRequestException("Slug already exists for this tenant");
    }

    return this.prisma.location.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug,
        gatewayKey: generateToken(24),
      },
    });
  }

  async update(tenantId: string, id: string, input: UpdateLocationInput) {
    const data = updateLocationSchema.parse(input);
    await this.assertLocationBelongsToTenant(tenantId, id);

    if (data.slug) {
      const existingSlug = await this.prisma.location.findFirst({
        where: { tenantId, slug: data.slug, id: { not: id } },
      });
      if (existingSlug) {
        throw new BadRequestException("Slug already exists for this tenant");
      }
    }

    return this.prisma.location.update({
      where: { id },
      data: { name: data.name, slug: data.slug },
    });
  }

  async regenerateGatewayKey(tenantId: string, id: string) {
    await this.assertLocationBelongsToTenant(tenantId, id);

    const location = await this.prisma.location.update({
      where: { id },
      data: { gatewayKey: generateToken(24) },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: "GATEWAY_KEY_REGENERATED",
        entityType: "Location",
        entityId: id,
      },
    });

    return { gatewayKey: location.gatewayKey };
  }

  private async assertLocationBelongsToTenant(tenantId: string, id: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }
    return location;
  }
}
