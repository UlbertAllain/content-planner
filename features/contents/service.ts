import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AppUser } from "@/features/users/types";
import { findCompanyById, findFormatById, findGoalById, findPillarById, findPlatformById } from "@/features/master-data/repository";
import { isAdmin } from "@/lib/permissions/roles";
import { canControlContent, canEditContent, canManagePublishedContent } from "@/lib/permissions/content-access";
import { contentDraftSchema, publishSchema, type ContentDraftData, type ContentDraftInput } from "./schema";
import { archiveContent, createContent, findContentById, restoreContent, updateContent } from "./repository";
import type { Content, ContentStatus } from "./types";
import { contentStatusLabel, normalizeContentStatus } from "./labels";

function activityRef() { return adminDb().collection("activities").doc(); }

function assertStatus(content: Content, allowed: ContentStatus[]) {
  if (!allowed.includes(content.status)) throw new Error(`Aksi ini tidak tersedia saat konten berada pada tahap ${contentStatusLabel(content.status)}.`);
}

function assertTransactionContent(doc: FirebaseFirestore.DocumentSnapshot, allowed: ContentStatus[]) {
  if (!doc.exists || doc.data()?.archivedAt) throw new Error("Konten tidak ditemukan atau sudah berada di arsip.");
  const status = normalizeContentStatus(doc.data()?.status);
  if (!allowed.includes(status)) throw new Error(`Tahap konten sudah berubah menjadi ${contentStatusLabel(status)}. Muat ulang halaman lalu coba lagi.`);
  return doc.data()!;
}

function assertReadyToWork(content: Content | ContentDraftData) {
  if (!content.title?.trim()) throw new Error("Isi topik atau judul konten sebelum mulai dikerjakan.");
  if (!content.platformIds.length) throw new Error("Pilih minimal satu platform sebelum mulai dikerjakan.");
  if (!content.formatId) throw new Error("Pilih jenis konten sebelum mulai dikerjakan.");
}

async function validateReferences(input: ContentDraftData) {
  const [company, pillar, goal, format, ...platforms] = await Promise.all([
    findCompanyById(input.companyId),
    input.pillarId ? findPillarById(input.pillarId) : null,
    input.goalId ? findGoalById(input.goalId) : null,
    input.formatId ? findFormatById(input.formatId) : null,
    ...input.platformIds.map((id) => findPlatformById(id)),
  ]);
  if (!company || !company.isActive) throw new Error("Perusahaan yang dipilih tidak tersedia.");
  if (input.pillarId && (!pillar || !pillar.isActive)) throw new Error("Kategori konten yang dipilih tidak tersedia.");
  if (input.goalId && (!goal || !goal.isActive)) throw new Error("Tujuan konten yang dipilih tidak tersedia.");
  if (input.formatId && (!format || !format.isActive)) throw new Error("Jenis konten yang dipilih tidak tersedia.");
  if (platforms.some((platform) => !platform || !platform.isActive)) throw new Error("Salah satu platform yang dipilih tidak tersedia.");
}

async function logActivity(entityId: string, actorId: string, action: string, metadata?: Record<string, unknown>) {
  await adminDb().collection("activities").add({
    entityType: "CONTENT", entityId, actorId, action,
    ...(metadata ? { metadata } : {}),
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function createDraftContentService(raw: ContentDraftInput, user: AppUser) {
  const input = contentDraftSchema.parse(raw);
  await validateReferences(input);
  const id = await createContent(input, user.id, "DRAFT");
  await logActivity(id, user.id, "CONTENT_CREATED");
  return id;
}

export async function updateContentService(id: string, raw: ContentDraftInput, user: AppUser) {
  const current = await findContentById(id);
  if (!current) throw new Error("Konten tidak ditemukan.");
  if (!canEditContent(user, current)) throw new Error("Konten ini hanya dapat diubah oleh pemiliknya atau Admin.");

  const input = contentDraftSchema.parse(raw);
  await validateReferences(input);
  if (["IN_PROGRESS", "READY", "SCHEDULED"].includes(current.status)) assertReadyToWork(input);

  const previousSchedule = current.plannedPublishAt?.getTime() ?? null;
  const nextSchedule = input.plannedPublishAt?.getTime() ?? null;
  const scheduleChanged = previousSchedule !== nextSchedule;
  const scheduleHasTime = scheduleChanged ? true : current.scheduleHasTime;

  await updateContent(id, input, current.ownerId ?? null, scheduleHasTime);
  await logActivity(id, user.id, "CONTENT_UPDATED");
}

export async function startContentService(id: string, user: AppUser) {
  const content = await findContentById(id);
  if (!content) throw new Error("Konten tidak ditemukan.");
  assertStatus(content, ["DRAFT"]);
  if (!canControlContent(user, content)) throw new Error("Konten ini hanya dapat dikerjakan oleh pemiliknya atau Admin.");
  assertReadyToWork(content);

  const ref = adminDb().collection("contents").doc(id);
  await adminDb().runTransaction(async (tx) => {
    assertTransactionContent(await tx.get(ref), ["DRAFT"]);
    tx.update(ref, { status: "IN_PROGRESS", updatedAt: FieldValue.serverTimestamp() });
    tx.set(activityRef(), { entityType: "CONTENT", entityId: id, actorId: user.id, action: "CONTENT_STARTED", createdAt: FieldValue.serverTimestamp() });
  });
}

export async function markReadyService(id: string, user: AppUser) {
  const content = await findContentById(id);
  if (!content) throw new Error("Konten tidak ditemukan.");
  assertStatus(content, ["IN_PROGRESS"]);
  if (!canControlContent(user, content)) throw new Error("Konten ini hanya dapat diubah oleh pemiliknya atau Admin.");
  assertReadyToWork(content);

  const ref = adminDb().collection("contents").doc(id);
  await adminDb().runTransaction(async (tx) => {
    assertTransactionContent(await tx.get(ref), ["IN_PROGRESS"]);
    tx.update(ref, { status: "READY", updatedAt: FieldValue.serverTimestamp() });
    tx.set(activityRef(), { entityType: "CONTENT", entityId: id, actorId: user.id, action: "CONTENT_READY", createdAt: FieldValue.serverTimestamp() });
  });
}

export async function scheduleContentService(id: string, user: AppUser) {
  const content = await findContentById(id);
  if (!content) throw new Error("Konten tidak ditemukan.");
  assertStatus(content, ["READY"]);
  if (!canControlContent(user, content)) throw new Error("Konten ini hanya dapat dijadwalkan oleh pemiliknya atau Admin.");
  if (!content.plannedPublishAt) throw new Error("Tentukan jadwal tayang terlebih dahulu.");

  const ref = adminDb().collection("contents").doc(id);
  await adminDb().runTransaction(async (tx) => {
    assertTransactionContent(await tx.get(ref), ["READY"]);
    tx.update(ref, { status: "SCHEDULED", updatedAt: FieldValue.serverTimestamp() });
    tx.set(activityRef(), { entityType: "CONTENT", entityId: id, actorId: user.id, action: "CONTENT_SCHEDULED", metadata: { plannedPublishAt: content.plannedPublishAt?.toISOString() }, createdAt: FieldValue.serverTimestamp() });
  });
}

export async function rescheduleContentService(id: string, plannedPublishAt: Date, user: AppUser) {
  const content = await findContentById(id);
  if (!content) throw new Error("Konten tidak ditemukan.");
  if (!["DRAFT", "IN_PROGRESS", "READY", "SCHEDULED"].includes(content.status)) throw new Error("Jadwal konten ini tidak dapat diubah pada tahap sekarang.");
  if (!canControlContent(user, content)) throw new Error("Jadwal ini hanya dapat diubah oleh pemilik konten atau Admin.");
  if (Number.isNaN(plannedPublishAt.getTime())) throw new Error("Jadwal tayang tidak valid.");

  const ref = adminDb().collection("contents").doc(id);
  await adminDb().runTransaction(async (tx) => {
    assertTransactionContent(await tx.get(ref), ["DRAFT", "IN_PROGRESS", "READY", "SCHEDULED"]);
    tx.update(ref, { plannedPublishAt, scheduleHasTime: true, updatedAt: FieldValue.serverTimestamp() });
    tx.set(activityRef(), { entityType: "CONTENT", entityId: id, actorId: user.id, action: "CONTENT_RESCHEDULED", metadata: { from: content.plannedPublishAt?.toISOString() ?? null, to: plannedPublishAt.toISOString() }, createdAt: FieldValue.serverTimestamp() });
  });
}

export async function markPublishedService(id: string, raw: { publishedAt: Date | string; publishedUrl?: string }, user: AppUser) {
  const content = await findContentById(id);
  if (!content) throw new Error("Konten tidak ditemukan.");
  assertStatus(content, ["SCHEDULED"]);
  if (!canControlContent(user, content)) throw new Error("Konten ini hanya dapat ditandai tayang oleh pemiliknya atau Admin.");

  const parsed = publishSchema.parse(raw);
  if (parsed.publishedAt.getTime() > Date.now() + 5 * 60 * 1000) throw new Error("Waktu tayang sebenarnya tidak boleh berada di masa depan.");
  const ref = adminDb().collection("contents").doc(id);
  await adminDb().runTransaction(async (tx) => {
    assertTransactionContent(await tx.get(ref), ["SCHEDULED"]);
    tx.update(ref, { status: "PUBLISHED", publishedAt: parsed.publishedAt, publishedUrl: parsed.publishedUrl || null, updatedAt: FieldValue.serverTimestamp() });
    tx.set(activityRef(), { entityType: "CONTENT", entityId: id, actorId: user.id, action: "CONTENT_PUBLISHED", metadata: { publishedAt: parsed.publishedAt.toISOString(), publishedUrl: parsed.publishedUrl || null }, createdAt: FieldValue.serverTimestamp() });
  });
}

export async function claimContentService(id: string, user: AppUser) {
  const content = await findContentById(id);
  if (!content || content.archivedAt) throw new Error("Konten tidak ditemukan.");
  if (content.ownerId) throw new Error("Konten ini sudah memiliki pemilik.");

  const ref = adminDb().collection("contents").doc(id);
  await adminDb().runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists || doc.data()?.ownerId) throw new Error("Konten ini sudah memiliki pemilik atau tidak ditemukan.");
    tx.update(ref, { ownerId: user.id, updatedAt: FieldValue.serverTimestamp() });
    tx.set(activityRef(), { entityType: "CONTENT", entityId: id, actorId: user.id, action: "CONTENT_CLAIMED", createdAt: FieldValue.serverTimestamp() });
  });
}

export async function cancelContentService(id: string, user: AppUser) {
  const content = await findContentById(id);
  if (!content) throw new Error("Konten tidak ditemukan.");
  if (["PUBLISHED", "CANCELLED"].includes(content.status)) throw new Error("Konten ini sudah selesai atau sudah dibatalkan.");
  if (!canControlContent(user, content)) throw new Error("Konten ini hanya dapat dibatalkan oleh pemiliknya atau Admin.");

  const ref = adminDb().collection("contents").doc(id);
  await adminDb().runTransaction(async (tx) => {
    assertTransactionContent(await tx.get(ref), ["DRAFT", "IN_PROGRESS", "READY", "SCHEDULED"]);
    tx.update(ref, { status: "CANCELLED", updatedAt: FieldValue.serverTimestamp() });
    tx.set(activityRef(), { entityType: "CONTENT", entityId: id, actorId: user.id, action: "CONTENT_CANCELLED", createdAt: FieldValue.serverTimestamp() });
  });
}

export async function archiveContentService(id: string, user: AppUser) {
  const content = await findContentById(id);
  if (!content || content.archivedAt) throw new Error("Konten tidak ditemukan atau sudah berada di arsip.");
  if (!["PUBLISHED", "CANCELLED"].includes(content.status)) throw new Error("Hanya konten yang sudah tayang atau dibatalkan yang dapat diarsipkan.");
  if (!canManagePublishedContent(user, content)) throw new Error("Konten ini hanya dapat diarsipkan oleh pemiliknya atau Admin.");
  await archiveContent(id, user.id);
  await logActivity(id, user.id, "CONTENT_ARCHIVED");
}

export async function restoreContentService(id: string, user: AppUser) {
  const content = await findContentById(id);
  if (!content?.archivedAt) throw new Error("Konten tidak ditemukan atau tidak berada di arsip.");
  if (!isAdmin(user) && content.ownerId !== user.id) throw new Error("Konten ini hanya dapat dipulihkan oleh pemiliknya atau Admin.");
  await restoreContent(id);
  await logActivity(id, user.id, "CONTENT_RESTORED");
}

async function deleteRefsInChunks(refs: FirebaseFirestore.DocumentReference[]) {
  const db = adminDb();
  for (let i = 0; i < refs.length; i += 450) {
    const batch = db.batch();
    refs.slice(i, i + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function permanentlyDeleteContentService(id: string, user: AppUser) {
  if (!isAdmin(user)) throw new Error("Hanya Admin yang dapat menghapus konten secara permanen.");
  const content = await findContentById(id);
  if (!content) throw new Error("Konten tidak ditemukan.");
  if (!content.archivedAt) throw new Error("Pindahkan konten ke arsip terlebih dahulu sebelum menghapusnya secara permanen.");

  const db = adminDb();
  const assetsSnap = await db.collection("contentAssets").where("contentId", "==", id).get();
  const { cloudinaryClient } = await import("@/lib/cloudinary/server");
  for (const doc of assetsSnap.docs) {
    const asset = doc.data();
    if (asset.source === "CLOUDINARY" && asset.publicId) {
      const resourceType = asset.resourceType === "VIDEO" ? "video" : asset.resourceType === "RAW" ? "raw" : "image";
      await cloudinaryClient().uploader.destroy(asset.publicId, { resource_type: resourceType, invalidate: true });
    }
  }

  // contentMetrics/contentTasks/contentReviews/notifications are legacy collections from older versions.
  // They are only touched here so a permanent delete also cleans old records if they still exist.
  const [comments, legacyMetrics, activities, legacyTasks, legacyReviews, legacyNotifications] = await Promise.all([
    db.collection("contentComments").where("entityType", "==", "CONTENT").where("entityId", "==", id).get(),
    db.collection("contentMetrics").where("contentId", "==", id).get(),
    db.collection("activities").where("entityType", "==", "CONTENT").where("entityId", "==", id).get(),
    db.collection("contentTasks").where("contentId", "==", id).get(),
    db.collection("contentReviews").where("contentId", "==", id).get(),
    db.collection("notifications").where("entityType", "==", "CONTENT").where("entityId", "==", id).get(),
  ]);

  const refs = [
    ...assetsSnap.docs.map((doc) => doc.ref),
    ...comments.docs.map((doc) => doc.ref),
    ...legacyMetrics.docs.map((doc) => doc.ref),
    ...activities.docs.map((doc) => doc.ref),
    ...legacyTasks.docs.map((doc) => doc.ref),
    ...legacyReviews.docs.map((doc) => doc.ref),
    ...legacyNotifications.docs.map((doc) => doc.ref),
    db.collection("contents").doc(id),
  ];
  await deleteRefsInChunks(refs);
}
