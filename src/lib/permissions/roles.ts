import type { AppUser } from "@/features/users/types";

export function isAdmin(user: AppUser) {
  return user.role === "ADMIN";
}
