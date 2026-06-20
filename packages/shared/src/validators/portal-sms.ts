import { z } from "zod";

export const smsSendSchema = z.object({
  phone: z.string().min(10).max(15),
  locationSlug: z.string().min(2).max(100),
});

export const smsVerifySchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
  locationSlug: z.string().min(2).max(100),
  macAddress: z.string().min(11),
  ipAddress: z.string().optional(),
});

export type SmsSendInput = z.infer<typeof smsSendSchema>;
export type SmsVerifyInput = z.infer<typeof smsVerifySchema>;
