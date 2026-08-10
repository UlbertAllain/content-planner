"use client";

import { useRef, useState } from "react";
import { registerCloudinaryAssetAction } from "./actions";
import type { AssetType } from "./types";

export function CloudinaryUploader({ contentId }: { contentId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(formData: FormData) {
    const file = inputRef.current?.files?.[0];
    const type = String(formData.get("type") || "FINAL_OUTPUT") as AssetType;
    const label = String(formData.get("label") || file?.name || "File media");

    if (!file) return setMessage("Pilih file yang ingin diunggah terlebih dahulu.");
    if (file.size > 25 * 1024 * 1024) return setMessage("Ukuran file maksimal 25 MB. Untuk file yang lebih besar, gunakan tautan Google Drive atau layanan sejenis.");

    setLoading(true);
    setMessage("");

    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, type }),
      });
      const signed = await signResponse.json();
      if (!signResponse.ok) throw new Error(signed.error || "Upload belum bisa disiapkan. Coba lagi.");

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", signed.apiKey);
      uploadData.append("timestamp", String(signed.timestamp));
      uploadData.append("signature", signed.signature);
      uploadData.append("folder", signed.folder);

      const cloudResponse = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`, {
        method: "POST",
        body: uploadData,
      });
      const result = await cloudResponse.json();
      if (!cloudResponse.ok) throw new Error(result.error?.message || "File gagal diunggah. Coba lagi.");

      await registerCloudinaryAssetAction({
        contentId,
        type,
        label,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: String(result.resource_type || "image").toUpperCase() as "IMAGE" | "VIDEO" | "RAW",
        fileName: result.original_filename,
        format: result.format,
        bytes: result.bytes,
      });

      if (inputRef.current) inputRef.current.value = "";
      setMessage("File berhasil diunggah.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "File gagal diunggah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={upload} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
      <div>
        <input className="field" name="label" placeholder="Nama file, contoh: Carousel Final" />
        <input ref={inputRef} className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold" type="file" />
        {message ? <p className="mt-2 text-xs text-slate-500">{message}</p> : null}
      </div>
      <select className="field h-10" name="type" defaultValue="FINAL_OUTPUT">
        <option value="REFERENCE">Referensi</option>
        <option value="WORKING_FILE">File kerja</option>
        <option value="FINAL_OUTPUT">Hasil akhir</option>
      </select>
      <button className="btn-secondary h-10" disabled={loading}>{loading ? "Mengunggah..." : "Unggah file"}</button>
    </form>
  );
}
