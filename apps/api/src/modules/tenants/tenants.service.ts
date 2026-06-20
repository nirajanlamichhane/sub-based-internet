import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import {
  LicenseStatus,
  Role,
  SaaSPlan,
} from "@sub-based-internet/shared/constants/enums";
import {
  createTenantSchema,
  updateTenantSchema,
  type CreateTenantInput,
  type UpdateTenantInput,
} from "@sub-based-internet/shared/validators/tenant";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tenant.findMany({
      include: { _count: { select: { locations: true, users: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateTenantInput) {
    const data = createTenantSchema.parse(input);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        plan: (data.plan as SaaSPlan) ?? SaaSPlan.STARTER,
        licenseStatus: (data.licenseStatus as LicenseStatus) ?? LicenseStatus.ACTIVE,
      },
    });

    if (data.ownerEmail && data.ownerPassword) {
      const passwordHash = await bcrypt.hash(data.ownerPassword, 10);
      await this.prisma.user.create({
        data: {
          email: data.ownerEmail,
          passwordHash,
          role: Role.OWNER,
          tenantId: tenant.id,
        },
      });
    }

    return tenant;
  }

  async update(id: string, input: UpdateTenantInput) {
    const data = updateTenantSchema.parse(input);

    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        plan: data.plan as SaaSPlan | undefined,
        licenseStatus: data.licenseStatus as LicenseStatus | undefined,
      },
    });
  }
}
