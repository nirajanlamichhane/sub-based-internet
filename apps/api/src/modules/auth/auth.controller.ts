import { Body, Controller, ForbiddenException, Post, UseGuards } from "@nestjs/common";
import { env } from "../../config/env";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { RateLimitGuard } from "../../common/guards/rate-limit.guard";
import { parseBody } from "../../common/utils/parse-body";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@sub-based-internet/shared/validators/auth";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: env.authRateLimit,
    windowSec: env.authRateWindowSec,
    keyPrefix: "auth-login",
  })
  @Post("login")
  login(@Body() body: unknown) {
    return this.authService.login(parseBody(loginSchema, body));
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: env.authRateLimit,
    windowSec: env.authRateWindowSec,
    keyPrefix: "auth-refresh",
  })
  @Post("refresh")
  refresh(@Body() body: unknown) {
    return this.authService.refresh(parseBody(refreshTokenSchema, body));
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: env.authRateLimit,
    windowSec: env.authRateWindowSec,
    keyPrefix: "auth-register",
  })
  @Post("register")
  register(@Body() body: unknown) {
    if (env.disablePublicRegister) {
      throw new ForbiddenException("Public registration is disabled");
    }
    return this.authService.register(parseBody(registerSchema, body));
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: env.authRateLimit,
    windowSec: env.authRateWindowSec,
    keyPrefix: "auth-forgot",
  })
  @Post("forgot-password")
  forgotPassword(@Body() body: unknown) {
    return this.authService.forgotPassword(parseBody(forgotPasswordSchema, body));
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: env.authRateLimit,
    windowSec: env.authRateWindowSec,
    keyPrefix: "auth-reset",
  })
  @Post("reset-password")
  resetPassword(@Body() body: unknown) {
    return this.authService.resetPassword(parseBody(resetPasswordSchema, body));
  }
}
