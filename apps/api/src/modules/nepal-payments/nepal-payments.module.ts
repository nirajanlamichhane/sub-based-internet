import { Module } from "@nestjs/common";
import { NepalPaymentsController } from "./nepal-payments.controller";
import { NepalPaymentsService } from "./nepal-payments.service";

@Module({
  controllers: [NepalPaymentsController],
  providers: [NepalPaymentsService],
})
export class NepalPaymentsModule {}
