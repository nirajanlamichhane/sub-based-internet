import { Body, Controller, Post } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { parseBody } from "../../common/utils/parse-body";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from "@sub-based-internet/shared/validators/auth";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() body: unknown) {
    return this.authService.login(parseBody(loginSchema, body));
  }

  @Public()
  @Post("refresh")
  refresh(@Body() body: unknown) {
    return this.authService.refresh(parseBody(refreshTokenSchema, body));
  }

  @Public()
  @Post("register")
  register(@Body() body: unknown) {
    return this.authService.register(parseBody(registerSchema, body));
  }
}
