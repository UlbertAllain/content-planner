"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { parseDateTimeInput } from "@/lib/utils/date";
import type { ContentDraftInput } from "./schema";
import {
  archiveContentService,
  cancelContentService,
  claimContentService,
  createDraftContentService,
  markPublishedService,
  markReadyService,
  permanentlyDeleteContentService,
  rescheduleContentService,
  restoreContentService,
  scheduleContentService,
  startContentService,
  updateContentService,
} from "./service";

function optional(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || undefined;
}

function parseContentForm(formData: FormData): ContentDraftInput {
  return {
    companyId: String(formData.get("companyId") || "").trim(),
    title: optional(formData.get("title")),
    pillarId: optional(formData.get("pillarId")),
    goalId: optional(formData.get("goalId")),
    platformIds: formData.getAll("platformIds").map(String).filter(Boolean),
    formatId: optional(formData.get("formatId")),
    brief: optional(formData.get("brief")),
    script: optional(formData.get("script")),
    caption: optional(formData.get("caption")),
    plannedPublishAt: optional(formData.get("plannedPublishAt")) ? parseDateTimeInput(String(formData.get("plannedPublishAt"))) : undefined,
  };
}

function revalidateContentViews(id: string) {
  revalidatePath(`/contents/${id}`);
  revalidatePath("/contents");
  revalidatePath("/board");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/my-work");
}

export async function createDraftContentAction(formData: FormData) {
  const user = await requireUser();
  const id = await createDraftContentService(parseContentForm(formData), user);
  redirect(`/contents/${id}`);
}

export async function updateContentAction(id: string, formData: FormData) {
  const user = await requireUser();
  await updateContentService(id, parseContentForm(formData), user);
  revalidateContentViews(id);
}

async function transition(id: string, fn: (id: string, user: Awaited<ReturnType<typeof requireUser>>) => Promise<void>) {
  const user = await requireUser();
  await fn(id, user);
  revalidateContentViews(id);
}

export const startContentAction = async (id: string) => transition(id, startContentService);
export const markReadyAction = async (id: string) => transition(id, markReadyService);
export const scheduleContentAction = async (id: string) => transition(id, scheduleContentService);
export const claimContentAction = async (id: string) => transition(id, claimContentService);
export const cancelContentAction = async (id: string) => transition(id, cancelContentService);
export const archiveContentAction = async (id: string) => transition(id, archiveContentService);
export const restoreContentAction = async (id: string) => transition(id, restoreContentService);

export async function permanentlyDeleteContentAction(id: string) {
  const user = await requireUser();
  await permanentlyDeleteContentService(id, user);
  redirect("/contents?archived=1");
}

export async function rescheduleContentFormAction(id: string, formData: FormData) {
  const user = await requireUser();
  await rescheduleContentService(id, parseDateTimeInput(String(formData.get("plannedPublishAt") || "")), user);
  revalidateContentViews(id);
}

export async function markPublishedAction(id: string, formData: FormData) {
  const user = await requireUser();
  await markPublishedService(id, {
    publishedAt: parseDateTimeInput(String(formData.get("publishedAt") || "")),
    publishedUrl: optional(formData.get("publishedUrl")),
  }, user);
  revalidateContentViews(id);
}
