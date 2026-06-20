import { Module } from "@nestjs/common";
import { ExpiryService } from "./expiry.service";
import { JobsService } from "./jobs.service";

@Module({
  providers: [ExpiryService, JobsService],
  exports: [ExpiryService],
})
export class JobsModule {}
