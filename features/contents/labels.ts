import type { ContentStatus } from "./types";
import type { AssetSource, AssetType } from "@/features/assets/types";

export const contentStatusLabels: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "Sedang Dikerjakan",
  READY: "Siap Tayang",
  SCHEDULED: "Terjadwal",
  PUBLISHED: "Sudah Tayang",
  CANCELLED: "Dibatalkan",
};

export const assetTypeLabels: Record<AssetType, string> = {
  REFERENCE: "Referensi",
  WORKING_FILE: "File Kerja",
  FINAL_OUTPUT: "Hasil Akhir",
};

export const assetSourceLabels: Record<AssetSource, string> = {
  CLOUDINARY: "File Upload",
  EXTERNAL: "Tautan Eksternal",
};

export const activityLabels: Record<string, string> = {
  CONTENT_CREATED: "Rencana konten dibuat",
  CONTENT_UPDATED: "Isi konten diperbarui",
  CONTENT_STARTED: "Konten mulai dikerjakan",
  CONTENT_READY: "Konten ditandai siap tayang",
  CONTENT_SCHEDULED: "Konten dijadwalkan",
  CONTENT_RESCHEDULED: "Jadwal tayang diubah",
  CONTENT_PUBLISHED: "Konten ditandai sudah tayang",
  CONTENT_CANCELLED: "Konten dibatalkan",
  CONTENT_CLAIMED: "Konten lama diambil alih",
  CONTENT_ARCHIVED: "Konten dipindahkan ke arsip",
  CONTENT_RESTORED: "Konten dipulihkan dari arsip",
  ASSET_ADDED: "File atau tautan ditambahkan",
  ASSET_DELETED: "File atau tautan dihapus",
  COMMENT_ADDED: "Catatan ditambahkan",
  COMMENT_DELETED: "Catatan dihapus",
  LEGACY_IMPORTED: "Konten lama dimigrasikan dari Excel",
};

export function normalizeContentStatus(value: unknown): ContentStatus {
  switch (value) {
    case "IDEA":
    case "PLANNED":
    case "DRAFT": return "DRAFT";
    case "IN_PRODUCTION":
    case "IN_REVIEW":
    case "REVISION":
    case "IN_PROGRESS": return "IN_PROGRESS";
    case "APPROVED":
    case "READY": return "READY";
    case "SCHEDULED": return "SCHEDULED";
    case "PUBLISHED": return "PUBLISHED";
    case "CANCELLED": return "CANCELLED";
    default: return "DRAFT";
  }
}

export function contentStatusLabel(status: ContentStatus) {
  return contentStatusLabels[status] ?? status;
}

export function activityLabel(action: string) {
  return activityLabels[action] ?? action.replaceAll("_", " ").toLocaleLowerCase("id-ID");
}
