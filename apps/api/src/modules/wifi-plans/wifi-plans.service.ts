import { Injectable, NotFoundException } from "@nestjs/common";
import {
  createWifiPlanSchema,
  updateWifiPlanSchema,
  type CreateWifiPlanInput,
  type UpdateWifiPlanInput,
} from "@sub-based-internet/shared/validators/wifi-plan";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class WifiPlansService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, locationId?: string) {
    return this.prisma.wifiPlan.findMany({
      where: {
        location: { tenantId },
        ...(locationId ? { locationId } : {}),
      },
      include: { location: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(tenantId: string, input: CreateWifiPlanInput) {
    const data = createWifiPlanSchema.parse(input);
    await this.assertLocation(tenantId, data.locationId);

    return this.prisma.wifiPlan.create({
      data: {
        locationId: data.locationId,
        name: data.name,
        durationMins: data.durationMins,
        speedMbps: data.speedMbps,
        dataCapMb: data.dataCapMb ?? null,
        deviceLimit: data.deviceLimit,
        price: data.price,
      },
    });
  }

  async update(tenantId: string, id: string, input: UpdateWifiPlanInput) {
    const data = updateWifiPlanSchema.parse(input);
    await this.assertPlan(tenantId, id);

    return this.prisma.wifiPlan.update({
      where: { id },
      data: {
        name: data.name,
        durationMins: data.durationMins,
        speedMbps: data.speedMbps,
        dataCapMb: data.dataCapMb,
        deviceLimit: data.deviceLimit,
        price: data.price,
        isActive: data.isActive,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.assertPlan(tenantId, id);
    return this.prisma.wifiPlan.delete({ where: { id } });
  }

  private async assertLocation(tenantId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }
    return location;
  }

  private async assertPlan(tenantId: string, id: string) {
    const plan = await this.prisma.wifiPlan.findFirst({
      where: { id, location: { tenantId } },
    });
    if (!plan) {
      throw new NotFoundException("Wi-Fi plan not found");
    }
    return plan;
  }
}
