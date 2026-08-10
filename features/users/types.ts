export type UserRole = "ADMIN" | "MEDIA_TEAM";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  position?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
