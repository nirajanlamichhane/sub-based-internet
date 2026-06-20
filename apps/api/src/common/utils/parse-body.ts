import { BadRequestException } from "@nestjs/common";
import { z, type ZodType } from "zod";

export function parseBody<T extends ZodType>(schema: T, body: unknown): z.output<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join("; ");
    throw new BadRequestException(message);
  }
  return result.data;
}
