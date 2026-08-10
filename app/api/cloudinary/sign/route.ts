import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { isTrustedOrigin } from "@/lib/auth/origin";
import { findContentById } from "@/features/contents/repository";
import { canEditContent } from "@/lib/permissions/content-access";
import { cloudinaryClient } from "@/lib/cloudinary/server";

const schema = z.object({
  contentId: z.string().min(1),
  type: z.enum(["REFERENCE", "WORKING_FILE", "FINAL_OUTPUT"]),
});

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: "Permintaan tidak diizinkan." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

  try {
    const { contentId, type } = schema.parse(await request.json());
    const content = await findContentById(contentId);
    if (!content) return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 });
    if (!canEditContent(user, content)) {
      return NextResponse.json({ error: "Kamu tidak memiliki akses untuk mengunggah file pada konten ini." }, { status: 403 });
    }

    const segment = type === "REFERENCE" ? "references" : type === "WORKING_FILE" ? "working" : "final";
    const folder = `nexty-content/contents/${contentId}/${segment}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const client = cloudinaryClient();
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const signature = client.utils.api_sign_request({ folder, timestamp }, apiSecret);

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch {
    return NextResponse.json({ error: "Upload belum dapat disiapkan. Coba lagi." }, { status: 400 });
  }
}
