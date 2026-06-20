import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createLocationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(slugRegex, "Slug must be lowercase alphanumeric with hyphens"),
});

export const updateLocationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().regex(slugRegex).optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
