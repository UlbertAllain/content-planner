import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const contentDraftSchema = z.object({
  companyId: z.string().trim().min(1, "Pilih perusahaan terlebih dahulu."),
  title: optionalText(160),
  pillarId: z.string().optional(),
  goalId: z.string().optional(),
  platformIds: z.array(z.string()).max(20).default([]),
  formatId: z.string().optional(),
  brief: optionalText(5000),
  script: optionalText(12000),
  caption: optionalText(8000),
  plannedPublishAt: z.coerce.date().optional(),
});

export const publishSchema = z.object({
  publishedAt: z.coerce.date(),
  publishedUrl: z.string().trim().url("Tautan konten yang sudah tayang tidak valid.").optional().or(z.literal("")),
});

export type ContentDraftInput = z.input<typeof contentDraftSchema>;
export type ContentDraftData = z.infer<typeof contentDraftSchema>;
