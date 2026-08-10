import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { cleanFirestoreData } from "@/lib/firebase/firestore-data";
import type { Comment, CommentEntityType } from "./types";

const collection = () => adminDb().collection("contentComments");

function map(doc: FirebaseFirestore.DocumentSnapshot): Comment {
  const data = doc.data()!;
  const date = (value: unknown) => (value instanceof Timestamp ? value.toDate() : undefined);
  return {
    id: doc.id,
    entityType: data.entityType,
    entityId: data.entityId,
    authorId: data.authorId,
    message: data.message,
    mentionUserIds: data.mentionUserIds ?? [],
    createdAt: date(data.createdAt) ?? new Date(),
    updatedAt: date(data.updatedAt),
    deletedAt: date(data.deletedAt),
  };
}

export async function listComments(entityType: CommentEntityType, entityId: string) {
  const snap = await collection().where("entityType", "==", entityType).where("entityId", "==", entityId).orderBy("createdAt", "asc").get();
  return snap.docs.map(map);
}

export async function createComment(input: Omit<Comment, "id" | "createdAt" | "updatedAt" | "deletedAt">) {
  const ref = collection().doc();
  await ref.set(
    cleanFirestoreData({
      ...input,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: null,
      deletedAt: null,
    }),
  );
  return ref.id;
}

export async function findComment(id: string) {
  const doc = await collection().doc(id).get();
  return doc.exists ? map(doc) : null;
}

export async function softDeleteComment(id: string) {
  await collection().doc(id).update({
    message: "",
    deletedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
