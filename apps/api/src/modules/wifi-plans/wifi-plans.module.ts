import { Module } from "@nestjs/common";
import { WifiPlansController } from "./wifi-plans.controller";
import { WifiPlansService } from "./wifi-plans.service";

@Module({
  controllers: [WifiPlansController],
  providers: [WifiPlansService],
  exports: [WifiPlansService],
})
export class WifiPlansModule {}
