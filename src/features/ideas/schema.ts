import { z } from "zod";

export const ideaSchema = z.object({
  companyId: z.string().trim().min(1, "Pilih perusahaan terlebih dahulu."),
  title: z.string().trim().min(3, "Tulis ide minimal 3 karakter.").max(180),
  description: z.string().trim().max(2500).optional(),
  senderName: z.string().trim().max(100).optional(),
});

export type IdeaInput = z.input<typeof ideaSchema>;
