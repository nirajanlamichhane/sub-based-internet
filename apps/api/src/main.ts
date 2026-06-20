import "./config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: env.webUrl });
  await app.listen(env.apiPort);
  console.log(`API running on http://localhost:${env.apiPort}`);
}
bootstrap();
