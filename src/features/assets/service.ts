import "server-only";

import { z } from "zod";
import { findContentById } from "@/features/contents/repository";
import { canEditContent } from "@/lib/permissions/content-access";
import type { AppUser } from "@/features/users/types";
import { createActivity } from "@/features/activities/repository";
import { cloudinaryClient } from "@/lib/cloudinary/server";
import { createContentAsset, deleteContentAssetRecord, findContentAsset } from "./repository";
import type { AssetResourceType, AssetType } from "./types";

const externalSchema = z.object({
  contentId: z.string().min(1),
  type: z.enum(["REFERENCE", "WORKING_FILE", "FINAL_OUTPUT"]),
  label: z.string().trim().min(2).max(120),
  url: z.string().trim().url(),
});

async function assertContentAccess(contentId: string, user: AppUser) {
  const content = await findContentById(contentId);
  if (!content) throw new Error("Konten tidak ditemukan.");
  if (content.archivedAt || !canEditContent(user, content)) throw new Error("File dan tautan hanya dapat diubah selama konten masih berada dalam tahap pengerjaan yang bisa diedit.");
  return content;
}

export async function addExternalAssetService(raw: z.input<typeof externalSchema>, user: AppUser) {
  const input = externalSchema.parse(raw);
  await assertContentAccess(input.contentId, user);
  const id = await createContentAsset({ ...input, source: "EXTERNAL", uploadedBy: user.id });
  await createActivity({ entityType: "CONTENT", entityId: input.contentId, actorId: user.id, action: "ASSET_ADDED", metadata: { assetId: id, label: input.label, source: "EXTERNAL" } });
  return id;
}

export async function registerCloudinaryAssetService(input: {
  contentId: string;
  type: AssetType;
  label: string;
  url: string;
  publicId: string;
  resourceType: AssetResourceType;
  fileName?: string;
  format?: string;
  bytes?: number;
}, user: AppUser) {
  await assertContentAccess(input.contentId, user);
  const expectedPrefix = `nexty-content/contents/${input.contentId}/`;
  if (!input.publicId.startsWith(expectedPrefix)) throw new Error("File upload tidak sesuai dengan konten ini.");
  let assetUrl: URL;
  try {
    assetUrl = new URL(input.url);
  } catch {
    throw new Error("Tautan file upload tidak valid.");
  }
  if (assetUrl.protocol !== "https:" || assetUrl.hostname !== "res.cloudinary.com") {
    throw new Error("File upload tidak berasal dari sumber penyimpanan yang valid.");
  }
  const id = await createContentAsset({ ...input, source: "CLOUDINARY", uploadedBy: user.id });
  await createActivity({ entityType: "CONTENT", entityId: input.contentId, actorId: user.id, action: "ASSET_ADDED", metadata: { assetId: id, label: input.label, source: "CLOUDINARY" } });
  return id;
}

export async function deleteAssetService(assetId: string, user: AppUser) {
  const asset = await findContentAsset(assetId);
  if (!asset) throw new Error("File atau tautan tidak ditemukan.");
  await assertContentAccess(asset.contentId, user);
  if (asset.source === "CLOUDINARY" && asset.publicId) {
    const resourceType = asset.resourceType === "VIDEO" ? "video" : asset.resourceType === "RAW" ? "raw" : "image";
    await cloudinaryClient().uploader.destroy(asset.publicId, { resource_type: resourceType, invalidate: true });
  }
  await deleteContentAssetRecord(assetId);
  await createActivity({ entityType: "CONTENT", entityId: asset.contentId, actorId: user.id, action: "ASSET_DELETED", metadata: { assetId, label: asset.label } });
}
