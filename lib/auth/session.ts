import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { findUserById } from "@/features/users/repository";
import { DEFAULT_SESSION_COOKIE } from "./constants";
import type { AppUser } from "@/features/users/types";

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const cookieName = process.env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE;
  const session = cookieStore.get(cookieName)?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    const user = await findUserById(decoded.uid);
    if (!user || user.status !== "ACTIVE") return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: AppUser["role"][]): Promise<AppUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
