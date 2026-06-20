import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import { env } from "../../config/env";
import { ExpiryService } from "./expiry.service";

const QUEUE_NAME = "maintenance";
const JOB_EXPIRE_STALE = "expire-stale";

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private queue?: Queue;
  private worker?: Worker;

  constructor(private readonly expiryService: ExpiryService) {}

  async onModuleInit() {
    const connection = { url: env.redisUrl };

    this.queue = new Queue(QUEUE_NAME, { connection });

    await this.queue.add(
      JOB_EXPIRE_STALE,
      {},
      {
        repeat: { every: 60_000 },
        jobId: JOB_EXPIRE_STALE,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        if (job.name === JOB_EXPIRE_STALE) {
          return this.expiryService.expireStaleRecords();
        }
      },
      { connection },
    );

    this.worker.on("failed", (job, err) => {
      console.error(`[JobsService] job ${job?.name} failed:`, err.message);
    });

    await this.expiryService.expireStaleRecords();
    console.log("[JobsService] maintenance worker started (every 60s)");
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }
}
