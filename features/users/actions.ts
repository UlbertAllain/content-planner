"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createAppUser, setUserPassword, updateAppUser } from "./service";

const roleSchema = z.enum(["ADMIN", "MEDIA_TEAM"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const createSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
    email: z.string().trim().email("Format email tidak valid."),
    password: z.string().min(8, "Password sementara minimal 8 karakter.").max(128),
    confirmPassword: z.string().min(8),
    role: roleSchema,
    position: z.string().trim().max(120).optional(),
    status: statusSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

const updateSchema = z.object({
  id: z.string().trim().min(10),
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  role: roleSchema,
  position: z.string().trim().max(120).optional(),
  status: statusSchema,
});

const passwordSchema = z.object({
  id: z.string().trim().min(10),
  password: z.string().min(8, "Password baru minimal 8 karakter.").max(128),
  confirmPassword: z.string().min(8),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Konfirmasi password tidak sama.",
  path: ["confirmPassword"],
});

function optionalString(value: FormDataEntryValue | null) {
  const normalized = String(value || "").trim();
  return normalized || undefined;
}

export async function createUserAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const input = createSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    position: optionalString(formData.get("position")),
    status: formData.get("status"),
  });

  await createAppUser(input);
  revalidatePath("/team");
}

export async function updateUserAction(formData: FormData) {
  const actor = await requireRole(["ADMIN"]);

  const input = updateSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    position: optionalString(formData.get("position")),
    status: formData.get("status"),
  });

  await updateAppUser(actor.id, input);
  revalidatePath("/team");
}

export async function setUserPasswordAction(formData: FormData) {
  const actor = await requireRole(["ADMIN"]);

  const input = passwordSchema.parse({
    id: formData.get("id"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  await setUserPassword(actor.id, input.id, input.password);
  revalidatePath("/team");
}
