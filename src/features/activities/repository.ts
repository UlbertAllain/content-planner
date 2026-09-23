import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { cleanFirestoreData } from "@/lib/firebase/firestore-data";
import type { Activity, ActivityEntityType } from "./types";

const collection = () => adminDb().collection("activities");

export async function createActivity(input: Omit<Activity, "id" | "createdAt">) {
  await collection().add(
    cleanFirestoreData({
      ...input,
      createdAt: FieldValue.serverTimestamp(),
    }),
  );
}

export async function listActivities(entityType: ActivityEntityType, entityId: string, limit = 50) {
  const snap = await collection()
    .where("entityType", "==", entityType)
    .where("entityId", "==", entityId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      entityType: data.entityType,
      entityId: data.entityId,
      actorId: data.actorId,
      action: data.action,
      metadata: data.metadata,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    } satisfies Activity;
  });
}
