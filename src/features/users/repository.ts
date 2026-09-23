import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { cleanFirestoreData } from "@/lib/firebase/firestore-data";
import type { AppUser, UserRole } from "./types";

const collection = () => adminDb().collection("users");

function normalizeRole(value: unknown): UserRole {
  if (value === "ADMIN") return "ADMIN";
  // Compatibility for data from versions before v1.0.7.
  return "MEDIA_TEAM";
}

function fromDoc(doc: FirebaseFirestore.DocumentSnapshot): AppUser | null {
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name ?? "",
    email: data.email ?? "",
    avatarUrl: data.avatarUrl || undefined,
    role: normalizeRole(data.role),
    position: data.position || undefined,
    status: data.status ?? "ACTIVE",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

export async function findUserById(id: string) {
  return fromDoc(await collection().doc(id).get());
}

export async function listUsers() {
  const snap = await collection().orderBy("name", "asc").get();
  return snap.docs.map((doc) => fromDoc(doc)!).filter(Boolean);
}

export async function createUserProfile(input: Omit<AppUser, "createdAt" | "updatedAt">) {
  const ref = collection().doc(input.id);
  const existing = await ref.get();

  if (existing.exists) throw new Error("Profil pengguna tersebut sudah terdaftar.");

  const now = FieldValue.serverTimestamp();
  await ref.set(cleanFirestoreData({
    id: input.id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    avatarUrl: input.avatarUrl ?? null,
    role: input.role,
    position: input.position?.trim() || null,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }));
}

export async function updateUserProfile(
  id: string,
  input: Pick<AppUser, "name" | "email" | "role" | "position" | "status">,
) {
  const ref = collection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error("Profil pengguna tidak ditemukan.");

  await ref.update(cleanFirestoreData({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    position: input.position?.trim() || null,
    status: input.status,
    updatedAt: FieldValue.serverTimestamp(),
  }));
}
