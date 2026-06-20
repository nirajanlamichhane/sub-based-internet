import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

const isProd = process.env.NODE_ENV === "production";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: isProd,
  apiPort: parseInt(process.env.API_PORT ?? "3001", 10),
  webUrl: process.env.WEB_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? (isProd ? "" : "dev-jwt-secret-change-me"),
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ?? (isProd ? "" : "dev-jwt-refresh-secret-change-me"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  redisRequired: process.env.REDIS_REQUIRED !== "0" && isProd,
  redeemRateLimit: parseInt(process.env.REDEEM_RATE_LIMIT ?? "20", 10),
  redeemRateWindowSec: parseInt(process.env.REDEEM_RATE_WINDOW_SEC ?? "60", 10),
  authRateLimit: parseInt(process.env.AUTH_RATE_LIMIT ?? "10", 10),
  authRateWindowSec: parseInt(process.env.AUTH_RATE_WINDOW_SEC ?? "60", 10),
  disablePublicRegister: process.env.DISABLE_PUBLIC_REGISTER === "1",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceStarter: process.env.STRIPE_PRICE_STARTER ?? "",
  stripePriceBusiness: process.env.STRIPE_PRICE_BUSINESS ?? "",
  stripePriceEnterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587", 10),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "noreply@localhost",
  smsProviderUrl: process.env.SMS_PROVIDER_URL ?? "",
  smsApiKey: process.env.SMS_API_KEY ?? "",
  smsOtpTtlSec: parseInt(process.env.SMS_OTP_TTL_SEC ?? "300", 10),
  smsSessionMins: parseInt(process.env.SMS_SESSION_MINS ?? "30", 10),
  smsSessionSpeedMbps: parseInt(process.env.SMS_SESSION_SPEED_MBPS ?? "5", 10),
  esewaMerchantId: process.env.ESEWA_MERCHANT_ID ?? "",
  esewaSecretKey: process.env.ESEWA_SECRET_KEY ?? "",
  esewaProductCode: process.env.ESEWA_PRODUCT_CODE ?? "EPAYTEST",
  esewaApiUrl: process.env.ESEWA_API_URL ?? "https://rc-epay.esewa.com.np",
  khaltiSecretKey: process.env.KHALTI_SECRET_KEY ?? "",
  khaltiApiUrl: process.env.KHALTI_API_URL ?? "https://khalti.com/api/v2",
};
