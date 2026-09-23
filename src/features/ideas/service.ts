import "server-only";

import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AppUser } from "@/features/users/types";
import { findCompanyById } from "@/features/master-data/repository";
import { ideaSchema, type IdeaInput } from "./schema";
import { createIdeaRecord, findIdeaById } from "./repository";

const PUBLIC_WINDOW_MS = 10 * 60 * 1000;
const PUBLIC_LIMIT = 5;

async function validateCompany(companyId: string) {
  const company = await findCompanyById(companyId);
  if (!company || !company.isActive) throw new Error("Perusahaan yang dipilih tidak tersedia.");
}

export async function createInternalIdeaService(raw: IdeaInput, user: AppUser) {
  const input = ideaSchema.parse(raw);
  await validateCompany(input.companyId);
  return createIdeaRecord({ ...input, source: "INTERNAL", createdBy: user.id });
}

export async function createPublicIdeaService(raw: IdeaInput, ipAddress: string) {
  const input = ideaSchema.parse(raw);
  await validateCompany(input.companyId);

  const db = adminDb();
  const rateKey = createHash("sha256").update(ipAddress || "unknown").digest("hex");
  const rateRef = db.collection("publicIdeaRateLimits").doc(rateKey);
  const ideaRef = db.collection("contentIdeas").doc();
  const now = new Date();

  await db.runTransaction(async (tx) => {
    const rateDoc = await tx.get(rateRef);
    const current = rateDoc.data();
    const startedAt = current?.windowStartedAt instanceof Timestamp ? current.windowStartedAt.toDate() : null;
    const inWindow = startedAt && now.getTime() - startedAt.getTime() < PUBLIC_WINDOW_MS;
    const count = inWindow ? Number(current?.count || 0) : 0;
    if (count >= PUBLIC_LIMIT) throw new Error("PUBLIC_IDEA_RATE_LIMIT");

    tx.set(rateRef, {
      windowStartedAt: inWindow ? current?.windowStartedAt : Timestamp.fromDate(now),
      count: count + 1,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    tx.set(ideaRef, {
      companyId: input.companyId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      senderName: input.senderName?.trim() || null,
      source: "PUBLIC",
      status: "NEW",
      createdBy: null,
      createdAt: FieldValue.serverTimestamp(),
      usedBy: null,
      usedAt: null,
      convertedContentId: null,
      archivedBy: null,
      archivedAt: null,
    });
  });

  return ideaRef.id;
}

export async function convertIdeaToContentService(id: string, user: AppUser) {
  const idea = await findIdeaById(id);
  if (!idea) throw new Error("Ide tidak ditemukan.");
  if (idea.status !== "NEW") throw new Error("Ide ini sudah diproses.");
  await validateCompany(idea.companyId);

  const db = adminDb();
  const ideaRef = db.collection("contentIdeas").doc(id);
  const contentRef = db.collection("contents").doc();
  const activityRef = db.collection("activities").doc();

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(ideaRef);
    if (!fresh.exists || fresh.data()?.status !== "NEW") throw new Error("Ide ini sudah diproses oleh anggota lain.");

    const now = FieldValue.serverTimestamp();
    tx.set(contentRef, {
      companyId: idea.companyId,
      title: idea.title,
      pillarId: null,
      goalId: null,
      platformIds: [],
      formatId: null,
      copy: { brief: idea.description || "", script: "", caption: "" },
      status: "DRAFT",
      ownerId: user.id,
      plannedPublishAt: null,
      scheduleHasTime: true,
      publishedAt: null,
      publishedUrl: null,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      archivedBy: null,
      sourceIdeaId: id,
    });
    tx.update(ideaRef, { status: "USED", usedBy: user.id, usedAt: now, convertedContentId: contentRef.id });
    tx.set(activityRef, { entityType: "CONTENT", entityId: contentRef.id, actorId: user.id, action: "CONTENT_CREATED", metadata: { sourceIdeaId: id }, createdAt: now });
  });

  return contentRef.id;
}

export async function archiveIdeaService(id: string, user: AppUser) {
  const idea = await findIdeaById(id);
  if (!idea) throw new Error("Ide tidak ditemukan.");
  if (idea.status !== "NEW") throw new Error("Hanya ide yang belum dipakai yang dapat diarsipkan.");
  await adminDb().collection("contentIdeas").doc(id).update({
    status: "ARCHIVED",
    archivedBy: user.id,
    archivedAt: FieldValue.serverTimestamp(),
  });
}
