import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

export const env = {
  apiPort: parseInt(process.env.API_PORT ?? "3001", 10),
  webUrl: process.env.WEB_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "dev-jwt-secret-change-me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-jwt-refresh-secret-change-me",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  redeemRateLimit: parseInt(process.env.REDEEM_RATE_LIMIT ?? "20", 10),
  redeemRateWindowSec: parseInt(process.env.REDEEM_RATE_WINDOW_SEC ?? "60", 10),
};
