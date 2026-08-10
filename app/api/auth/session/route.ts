import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { findUserById } from "@/features/users/repository";
import { DEFAULT_SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";
import { isTrustedOrigin } from "@/lib/auth/origin";

const schema = z.object({ idToken: z.string().min(20) });

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "Permintaan login tidak diizinkan." }, { status: 403 });
  }

  try {
    const { idToken } = schema.parse(await request.json());
    const decoded = await adminAuth().verifyIdToken(idToken);

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!decoded.auth_time || nowSeconds - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Sesi login terlalu lama. Silakan login ulang." }, { status: 401 });
    }

    const appUser = await findUserById(decoded.uid);
    if (!appUser || appUser.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun ini belum memiliki akses aktif ke sistem. Hubungi Admin jika seharusnya kamu memiliki akses." }, { status: 403 });
    }

    const expiresIn = SESSION_MAX_AGE_SECONDS * 1000;
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(process.env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Login gagal. Silakan periksa akun dan coba lagi." }, { status: 401 });
  }
}
