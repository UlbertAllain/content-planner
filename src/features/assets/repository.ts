import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { cleanFirestoreData } from "@/lib/firebase/firestore-data";
import type { ContentAsset } from "./types";

const collection = () => adminDb().collection("contentAssets");

function map(doc: FirebaseFirestore.DocumentSnapshot): ContentAsset {
  const data = doc.data()!;
  return {
    id: doc.id,
    contentId: data.contentId,
    type: data.type,
    source: data.source,
    label: data.label,
    url: data.url,
    publicId: data.publicId || undefined,
    resourceType: data.resourceType || undefined,
    fileName: data.fileName || undefined,
    format: data.format || undefined,
    bytes: typeof data.bytes === "number" ? data.bytes : undefined,
    uploadedBy: data.uploadedBy,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  };
}

export async function listContentAssets(contentId: string) {
  const snap = await collection().where("contentId", "==", contentId).orderBy("createdAt", "desc").get();
  return snap.docs.map(map);
}

export async function createContentAsset(input: Omit<ContentAsset, "id" | "createdAt">) {
  const ref = collection().doc();
  await ref.set(
    cleanFirestoreData({
      ...input,
      createdAt: FieldValue.serverTimestamp(),
    }),
  );
  return ref.id;
}

export async function findContentAsset(id: string) {
  const doc = await collection().doc(id).get();
  return doc.exists ? map(doc) : null;
}

export async function deleteContentAssetRecord(id: string) {
  await collection().doc(id).delete();
}
