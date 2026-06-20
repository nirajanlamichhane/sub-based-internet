import { randomBytes } from "crypto";
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
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
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RefreshTokenInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@sub-based-internet/shared/validators/auth";
import { env } from "../../config/env";
import { MailService } from "../../common/mail/mail.service";
import { RedisService } from "../../common/redis/redis.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser, JwtPayload } from "../../common/types/auth-user";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
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

  async forgotPassword(input: ForgotPasswordInput) {
    const data = forgotPasswordSchema.parse(input);
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      return { message: "If that email exists, a reset link was sent." };
    }

    const token = randomBytes(32).toString("hex");
    await this.redis.setEx(`password-reset:${token}`, user.id, 3600);
    const resetUrl = `${env.webUrl}/reset-password?token=${token}`;
    await this.mail.sendPasswordReset(user.email, resetUrl);

    const response: { message: string; resetUrl?: string } = {
      message: "If that email exists, a reset link was sent.",
    };
    if (!env.smtpHost && !env.isProduction) {
      response.resetUrl = resetUrl;
    }
    return response;
  }

  async resetPassword(input: ResetPasswordInput) {
    const data = resetPasswordSchema.parse(input);
    const userId = await this.redis.get(`password-reset:${data.token}`);
    if (!userId) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await this.redis.del(`password-reset:${data.token}`);

    return { message: "Password updated. You can sign in now." };
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
