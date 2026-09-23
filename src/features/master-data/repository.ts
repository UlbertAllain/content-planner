import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Company, ContentFormat, ContentGoal, ContentPillar, Platform } from "./types";

type MasterCollection = "companies" | "contentPillars" | "contentGoals" | "platforms" | "formats";

function mapBase<T>(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  } as T;
}

async function list<T>(name: MasterCollection, activeOnly = false) {
  let query: FirebaseFirestore.Query = adminDb().collection(name);
  if (activeOnly) query = query.where("isActive", "==", true);
  const snap = await query.orderBy("order", "asc").get();
  return snap.docs.map((doc) => mapBase<T>(doc));
}

async function find<T>(name: MasterCollection, id: string) {
  if (!id) return null;
  const doc = await adminDb().collection(name).doc(id).get();
  return doc.exists ? mapBase<T>(doc) : null;
}

export const findCompanyById = (id: string) => find<Company>("companies", id);
export const findPillarById = (id: string) => find<ContentPillar>("contentPillars", id);
export const findGoalById = (id: string) => find<ContentGoal>("contentGoals", id);
export const findPlatformById = (id: string) => find<Platform>("platforms", id);
export const findFormatById = (id: string) => find<ContentFormat>("formats", id);

export const listCompanies = (activeOnly = false) => list<Company>("companies", activeOnly);
export const listPillars = (activeOnly = false) => list<ContentPillar>("contentPillars", activeOnly);
export const listGoals = (activeOnly = false) => list<ContentGoal>("contentGoals", activeOnly);
export const listPlatforms = (activeOnly = false) => list<Platform>("platforms", activeOnly);
export const listFormats = (activeOnly = false) => list<ContentFormat>("formats", activeOnly);

export async function saveMasterData(
  collectionName: MasterCollection,
  input: { id?: string; name: string; shortName?: string; description?: string; iconKey?: string; isActive: boolean; order: number },
) {
  const collection = adminDb().collection(collectionName);
  const ref = input.id ? collection.doc(input.id) : collection.doc();
  const existing = await ref.get();
  const now = FieldValue.serverTimestamp();
  await ref.set(
    {
      name: input.name.trim(),
      ...(input.shortName !== undefined ? { shortName: input.shortName.trim() || null } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.iconKey !== undefined ? { iconKey: input.iconKey.trim() } : {}),
      isActive: input.isActive,
      order: input.order,
      createdAt: existing.exists ? existing.data()?.createdAt ?? now : now,
      updatedAt: now,
    },
    { merge: true },
  );
  return ref.id;
}
