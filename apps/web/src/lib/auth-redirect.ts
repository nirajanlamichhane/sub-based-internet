import { Role } from "@sub-based-internet/shared/constants/enums";
import type { UserDto } from "@sub-based-internet/shared/types";

export function homePathForUser(user: UserDto | null): string {
  if (!user) return "/login";
  if (user.role === Role.PLATFORM_ADMIN) return "/admin";
  return "/dashboard";
}
