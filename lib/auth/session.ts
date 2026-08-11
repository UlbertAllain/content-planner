import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { findUserById } from "@/features/users/repository";
import { DEFAULT_SESSION_COOKIE } from "./constants";
import type { AppUser } from "@/features/users/types";

/**
 * Verifikasi session dibuat request-scoped dengan React cache agar layout dan page
 * yang membutuhkan user yang sama tidak mengulang verifikasi + query user.
 *
 * checkRevoked sengaja tidak dipaksa pada setiap render karena Firebase akan
 * melakukan request tambahan ke Auth backend. Status akses aplikasi tetap dicek
 * melalui profil Firestore pada setiap request.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const cookieStore = await cookies();
  const cookieName = process.env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE;
  const session = cookieStore.get(cookieName)?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(session);
    const user = await findUserById(decoded.uid);
    if (!user || user.status !== "ACTIVE") return null;
    return user;
  } catch {
    return null;
  }
});

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
