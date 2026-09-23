"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createContentCommentService, deleteCommentService } from "./service";

export async function createContentCommentAction(contentId: string, formData: FormData) {
  const user = await requireUser();
  await createContentCommentService(contentId, {
    message: String(formData.get("message") || ""),
    mentionUserIds: formData.getAll("mentionUserIds").map(String),
  }, user);
  revalidatePath(`/contents/${contentId}`);
}

export async function deleteCommentAction(contentId: string, commentId: string) {
  const user = await requireUser();
  await deleteCommentService(commentId, user);
  revalidatePath(`/contents/${contentId}`);
}
