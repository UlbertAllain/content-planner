import type { Content } from "@/features/contents/types";
import type { AppUser } from "@/features/users/types";
import { isAdmin } from "./roles";

export function isContentOwner(user: AppUser, content: Content) {
  return content.ownerId === user.id;
}

export function canEditContent(user: AppUser, content: Content) {
  if (content.archivedAt || ["PUBLISHED", "CANCELLED"].includes(content.status)) return false;
  return isAdmin(user) || isContentOwner(user, content);
}

export function canControlContent(user: AppUser, content: Content) {
  if (content.archivedAt) return false;
  return isAdmin(user) || isContentOwner(user, content);
}

export function canManagePublishedContent(user: AppUser, content: Content) {
  return isAdmin(user) || isContentOwner(user, content);
}
