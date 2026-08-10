import type { UserRole, UserStatus } from "./types";

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  MEDIA_TEAM: "Tim Media",
};

export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
};

export function userRoleLabel(role: UserRole) {
  return userRoleLabels[role];
}
