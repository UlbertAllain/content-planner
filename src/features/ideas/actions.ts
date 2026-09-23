"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { archiveIdeaService, convertIdeaToContentService, createInternalIdeaService } from "./service";

function optional(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || undefined;
}

export async function createInternalIdeaAction(formData: FormData) {
  const user = await requireUser();
  await createInternalIdeaService({
    companyId: String(formData.get("companyId") || ""),
    title: String(formData.get("title") || ""),
    description: optional(formData.get("description")),
  }, user);
  revalidatePath("/ideas");
  revalidatePath("/dashboard");
}

export async function convertIdeaToContentAction(id: string) {
  const user = await requireUser();
  const contentId = await convertIdeaToContentService(id, user);
  revalidatePath("/ideas");
  revalidatePath("/dashboard");
  redirect(`/contents/${contentId}`);
}

export async function archiveIdeaAction(id: string) {
  const user = await requireUser();
  await archiveIdeaService(id, user);
  revalidatePath("/ideas");
  revalidatePath("/dashboard");
}
