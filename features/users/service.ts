import "server-only";

import { adminAuth } from "@/lib/firebase/admin";
import { createUserProfile, findUserById, updateUserProfile } from "./repository";
import type { UserRole, UserStatus } from "./types";

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  position?: string;
  status: UserStatus;
};

type UpdateUserInput = {
  id: string;
  name: string;
  role: UserRole;
  position?: string;
  status: UserStatus;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readableAuthError(error: unknown): Error {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code || "")
      : "";

  if (code.includes("email-already-exists")) {
    return new Error("Email tersebut sudah digunakan oleh akun lain.");
  }

  if (code.includes("invalid-email")) {
    return new Error("Format email tidak valid.");
  }

  if (code.includes("invalid-password")) {
    return new Error("Password sementara belum memenuhi ketentuan keamanan. Gunakan minimal 8 karakter.");
  }

  return error instanceof Error ? error : new Error("Data pengguna belum dapat diproses. Coba lagi.");
}

export async function createAppUser(input: CreateUserInput) {
  const auth = adminAuth();
  const email = normalizeEmail(input.email);

  let authUser: Awaited<ReturnType<typeof auth.createUser>>;

  try {
    authUser = await auth.createUser({
      email,
      password: input.password,
      displayName: input.name,
      disabled: input.status === "INACTIVE",
      emailVerified: false,
    });
  } catch (error) {
    throw readableAuthError(error);
  }

  try {
    await createUserProfile({
      id: authUser.uid,
      name: input.name,
      email,
      role: input.role,
      position: input.position,
      status: input.status,
    });
  } catch (error) {
    // Firebase Auth dan Firestore bukan satu transaction. Kalau profil gagal dibuat,
    // rollback akun Auth agar tidak meninggalkan user setengah jadi.
    await auth.deleteUser(authUser.uid).catch(() => undefined);
    throw error;
  }

  return authUser.uid;
}

export async function updateAppUser(actorId: string, input: UpdateUserInput) {
  const existingProfile = await findUserById(input.id);
  if (!existingProfile) throw new Error("Pengguna tidak ditemukan.");

  if (input.id === actorId && (input.role !== existingProfile.role || input.status !== "ACTIVE")) {
    throw new Error("Admin tidak dapat mengurangi hak akses atau menonaktifkan akunnya sendiri.");
  }

  const auth = adminAuth();
  const existingAuth = await auth.getUser(input.id).catch(() => null);
  if (!existingAuth || !existingAuth.email) {
    throw new Error("Akun login pengguna ini tidak ditemukan.");
  }

  try {
    await auth.updateUser(input.id, {
      displayName: input.name,
      disabled: input.status === "INACTIVE",
    });

    await updateUserProfile(input.id, {
      name: input.name,
      email: existingAuth.email,
      role: input.role,
      position: input.position,
      status: input.status,
    });
  } catch (error) {
    // Kembalikan perubahan Auth kalau update profil Firestore gagal.
    await auth
      .updateUser(input.id, {
        displayName: existingAuth.displayName,
        disabled: existingAuth.disabled,
      })
      .catch(() => undefined);

    throw readableAuthError(error);
  }
}

export async function setUserPassword(actorId: string, targetUserId: string, password: string) {
  if (actorId === targetUserId) {
    throw new Error("Password akun Admin yang sedang digunakan tidak dapat diubah dari pengelolaan anggota.");
  }

  const target = await findUserById(targetUserId);
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  try {
    await adminAuth().updateUser(targetUserId, { password });
  } catch (error) {
    throw readableAuthError(error);
  }
}
