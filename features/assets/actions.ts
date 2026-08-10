"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addExternalAssetService, deleteAssetService, registerCloudinaryAssetService } from "./service";
import type { AssetResourceType, AssetType } from "./types";

export async function addExternalAssetAction(contentId: string, formData: FormData) {
  const user = await requireUser();
  await addExternalAssetService({
    contentId,
    type: String(formData.get("type") || "REFERENCE") as AssetType,
    label: String(formData.get("label") || ""),
    url: String(formData.get("url") || ""),
  }, user);
  revalidatePath(`/contents/${contentId}`);
}

export async function registerCloudinaryAssetAction(input: {
  contentId: string;
  type: AssetType;
  label: string;
  url: string;
  publicId: string;
  resourceType: AssetResourceType;
  fileName?: string;
  format?: string;
  bytes?: number;
}) {
  const user = await requireUser();
  const id = await registerCloudinaryAssetService(input, user);
  revalidatePath(`/contents/${input.contentId}`);
  return id;
}

export async function deleteAssetAction(contentId: string, assetId: string) {
  const user = await requireUser();
  await deleteAssetService(assetId, user);
  revalidatePath(`/contents/${contentId}`);
}
