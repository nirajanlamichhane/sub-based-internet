import "./config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { validateEnv } from "./config/validate-env";

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({ origin: env.webUrl });
  await app.listen(env.apiPort);
  console.log(`API running on http://localhost:${env.apiPort}`);
}
bootstrap();
