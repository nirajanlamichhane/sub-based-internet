import { Body, Controller, Post } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { parseBody } from "../../common/utils/parse-body";
import { smsSendSchema, smsVerifySchema } from "@sub-based-internet/shared/validators/portal-sms";
import { PortalAuthService } from "./portal-auth.service";

@Controller("portal/sms")
export class PortalAuthController {
  constructor(private readonly portalAuth: PortalAuthService) {}

  @Public()
  @Post("send")
  send(@Body() body: unknown) {
    return this.portalAuth.sendOtp(parseBody(smsSendSchema, body));
  }

  @Public()
  @Post("verify")
  verify(@Body() body: unknown) {
    return this.portalAuth.verifyOtp(parseBody(smsVerifySchema, body));
  }
}
