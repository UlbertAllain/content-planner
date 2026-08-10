import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Content, ContentFilters, ContentStatus } from "./types";
import type { ContentDraftData } from "./schema";
import { normalizeContentStatus } from "./labels";

const collection = () => adminDb().collection("contents");

export function mapContent(doc: FirebaseFirestore.DocumentSnapshot): Content | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  const date = (value: unknown) => (value instanceof Timestamp ? value.toDate() : undefined);
  const legacyPlatformIds = data.platformId ? [data.platformId] : [];
  const legacyBrief = data.brief || data.objective || data.keyMessage || "";
  const legacyCopy = data.copy ?? {};

  return {
    id: doc.id,
    companyId: data.companyId || undefined,
    title: data.title || undefined,
    pillarId: data.pillarId || undefined,
    goalId: data.goalId || undefined,
    platformIds: Array.isArray(data.platformIds) ? data.platformIds : legacyPlatformIds,
    formatId: data.formatId || undefined,
    copy: {
      brief: legacyCopy.brief || legacyBrief || undefined,
      script: legacyCopy.script || legacyCopy.body || undefined,
      caption: legacyCopy.caption || undefined,
    },
    status: normalizeContentStatus(data.status),
    ownerId: data.ownerId || undefined,
    plannedPublishAt: date(data.plannedPublishAt),
    scheduleHasTime: data.scheduleHasTime ?? true,
    publishedAt: date(data.publishedAt),
    publishedUrl: data.publishedUrl || undefined,
    createdBy: data.createdBy,
    createdAt: date(data.createdAt) ?? new Date(),
    updatedAt: date(data.updatedAt) ?? new Date(),
    archivedAt: date(data.archivedAt),
    archivedBy: data.archivedBy || undefined,
  };
}

export async function findContentById(id: string) {
  return mapContent(await collection().doc(id).get());
}

export async function listContents(filters: ContentFilters = {}) {
  let query: FirebaseFirestore.Query = collection();
  if (filters.companyId) query = query.where("companyId", "==", filters.companyId);
  if (filters.platformId) query = query.where("platformIds", "array-contains", filters.platformId);
  if (filters.pillarId) query = query.where("pillarId", "==", filters.pillarId);
  if (filters.goalId) query = query.where("goalId", "==", filters.goalId);
  if (filters.formatId) query = query.where("formatId", "==", filters.formatId);
  if (filters.ownerId) query = query.where("ownerId", "==", filters.ownerId);
  if (filters.from) query = query.where("plannedPublishAt", ">=", filters.from);
  if (filters.to) query = query.where("plannedPublishAt", "<=", filters.to);
  query = query.orderBy(filters.from || filters.to ? "plannedPublishAt" : "updatedAt", "desc");
  if (filters.limit) query = query.limit(filters.limit);

  const snap = await query.get();
  let items = snap.docs.map((doc) => mapContent(doc)!).filter(Boolean);
  if (filters.status) items = items.filter((item) => item.status === filters.status);
  return filters.includeArchived ? items : items.filter((item) => !item.archivedAt);
}

export function contentInputData(input: ContentDraftData, ownerId: string | null, scheduleHasTime = true) {
  return {
    companyId: input.companyId,
    title: input.title || null,
    pillarId: input.pillarId || null,
    goalId: input.goalId || null,
    platformIds: input.platformIds,
    formatId: input.formatId || null,
    copy: {
      brief: input.brief || "",
      script: input.script || "",
      caption: input.caption || "",
    },
    ownerId,
    plannedPublishAt: input.plannedPublishAt ?? null,
    scheduleHasTime,
  };
}

export async function createContent(input: ContentDraftData, userId: string, status: ContentStatus) {
  const ref = collection().doc();
  await ref.set({
    ...contentInputData(input, userId),
    status,
    publishedAt: null,
    publishedUrl: null,
    createdBy: userId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    archivedAt: null,
    archivedBy: null,
  });
  return ref.id;
}

export async function updateContent(id: string, input: ContentDraftData, ownerId: string | null, scheduleHasTime = true) {
  await collection().doc(id).update({
    ...contentInputData(input, ownerId, scheduleHasTime),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function archiveContent(id: string, userId: string) {
  await collection().doc(id).update({ archivedAt: FieldValue.serverTimestamp(), archivedBy: userId, updatedAt: FieldValue.serverTimestamp() });
}

export async function restoreContent(id: string) {
  await collection().doc(id).update({ archivedAt: null, archivedBy: null, updatedAt: FieldValue.serverTimestamp() });
}
