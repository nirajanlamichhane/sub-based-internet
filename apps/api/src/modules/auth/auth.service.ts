import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import {
  LicenseStatus,
  Role,
  SaaSPlan,
} from "@sub-based-internet/shared/constants/enums";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  type LoginInput,
  type RefreshTokenInput,
  type RegisterInput,
} from "@sub-based-internet/shared/validators/auth";
import { env } from "../../config/env";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser, JwtPayload } from "../../common/types/auth-user";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput) {
    const data = loginSchema.parse(input);
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.buildTokenResponse(user);
  }

  async refresh(input: RefreshTokenInput) {
    const data = refreshTokenSchema.parse(input);

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(data.refreshToken, {
        secret: env.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.buildTokenResponse(user);
  }

  async register(input: RegisterInput) {
    const data = registerSchema.parse(input);

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.tenantName,
        plan: SaaSPlan.STARTER,
        licenseStatus: LicenseStatus.ACTIVE,
        users: {
          create: {
            email: data.email,
            passwordHash,
            role: Role.OWNER,
          },
        },
      },
      include: { users: true },
    });

    const owner = tenant.users[0];
    return this.buildTokenResponse(owner);
  }

  private buildTokenResponse(user: {
    id: string;
    email: string;
    role: Role;
    tenantId: string | null;
  }) {
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      tenantId: user.tenantId,
    };

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      tenantId: user.tenantId,
      type: "access",
    };

    const refreshPayload: JwtPayload = {
      ...accessPayload,
      type: "refresh",
    };

    return {
      accessToken: this.jwtService.sign(accessPayload, {
        secret: env.jwtSecret,
        expiresIn: env.jwtAccessExpiresIn,
      }),
      refreshToken: this.jwtService.sign(refreshPayload, {
        secret: env.jwtRefreshSecret,
        expiresIn: env.jwtRefreshExpiresIn,
      }),
      user: authUser,
    };
  }
}
