"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { listContents } from "@/features/contents/repository";
import { saveMasterData } from "./repository";

const baseSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  isActive: z.boolean(),
  order: z.coerce.number().int().min(0).max(9999),
});

const descriptiveSchema = baseSchema.extend({ description: z.string().trim().max(1000).optional() });
const companySchema = baseSchema.extend({ shortName: z.string().trim().max(60).optional() });
const platformSchema = baseSchema.extend({ iconKey: z.string().trim().max(80).optional() });

function common(formData: FormData) {
  return {
    id: String(formData.get("id") || "").trim() || undefined,
    name: String(formData.get("name") || ""),
    isActive: formData.get("isActive") === "on",
    order: String(formData.get("order") || "0"),
  };
}

function isWorkflowActive(status: string) {
  return !["PUBLISHED", "CANCELLED"].includes(status);
}

async function assertCanDeactivateContentReference(filter: { companyId?: string; pillarId?: string; goalId?: string; platformId?: string; formatId?: string }) {
  const contents = await listContents({ ...filter, includeArchived: true });
  if (contents.some((content) => isWorkflowActive(content.status))) {
    throw new Error("Data ini masih dipakai oleh konten yang sedang berjalan. Selesaikan atau ubah kontennya terlebih dahulu.");
  }
}

export async function saveCompanyAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const input = companySchema.parse({ ...common(formData), shortName: String(formData.get("shortName") || "").trim() || undefined });
  if (input.id && !input.isActive) await assertCanDeactivateContentReference({ companyId: input.id });
  await saveMasterData("companies", input);
  revalidatePath("/settings");
  revalidatePath("/calendar");
}

export async function savePillarAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const input = descriptiveSchema.parse({ ...common(formData), description: String(formData.get("description") || "").trim() || undefined });
  if (input.id && !input.isActive) await assertCanDeactivateContentReference({ pillarId: input.id });
  await saveMasterData("contentPillars", input);
  revalidatePath("/settings");
}

export async function saveGoalAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const input = descriptiveSchema.parse({ ...common(formData), description: String(formData.get("description") || "").trim() || undefined });
  if (input.id && !input.isActive) await assertCanDeactivateContentReference({ goalId: input.id });
  await saveMasterData("contentGoals", input);
  revalidatePath("/settings");
}

export async function savePlatformAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const input = platformSchema.parse({ ...common(formData), iconKey: String(formData.get("iconKey") || "").trim() || undefined });
  if (input.id && !input.isActive) await assertCanDeactivateContentReference({ platformId: input.id });
  await saveMasterData("platforms", input);
  revalidatePath("/settings");
}

export async function saveFormatAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const input = baseSchema.parse(common(formData));
  if (input.id && !input.isActive) await assertCanDeactivateContentReference({ formatId: input.id });
  await saveMasterData("formats", input);
  revalidatePath("/settings");
}
