import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { ContentIdea, ContentIdeaSource, ContentIdeaStatus } from "./types";

const collection = () => adminDb().collection("contentIdeas");

function mapIdea(doc: FirebaseFirestore.DocumentSnapshot): ContentIdea | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  const date = (value: unknown) => value instanceof Timestamp ? value.toDate() : undefined;
  return {
    id: doc.id,
    companyId: data.companyId,
    title: data.title,
    description: data.description || undefined,
    senderName: data.senderName || undefined,
    source: data.source as ContentIdeaSource,
    status: data.status as ContentIdeaStatus,
    createdBy: data.createdBy || undefined,
    createdAt: date(data.createdAt) ?? new Date(),
    usedBy: data.usedBy || undefined,
    usedAt: date(data.usedAt),
    convertedContentId: data.convertedContentId || undefined,
    archivedBy: data.archivedBy || undefined,
    archivedAt: date(data.archivedAt),
  };
}

export async function findIdeaById(id: string) {
  return mapIdea(await collection().doc(id).get());
}

export async function listIdeas(limit = 300) {
  const snap = await collection().orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => mapIdea(doc)!).filter(Boolean);
}

export async function createIdeaRecord(input: {
  companyId: string;
  title: string;
  description?: string;
  senderName?: string;
  source: ContentIdeaSource;
  createdBy?: string;
}) {
  const ref = collection().doc();
  await ref.set({
    companyId: input.companyId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    senderName: input.senderName?.trim() || null,
    source: input.source,
    status: "NEW",
    createdBy: input.createdBy || null,
    createdAt: FieldValue.serverTimestamp(),
    usedBy: null,
    usedAt: null,
    convertedContentId: null,
    archivedBy: null,
    archivedAt: null,
  });
  return ref.id;
}
