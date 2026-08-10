import { NextResponse } from "next/server";
import { z } from "zod";

import { adminAuth } from "@/lib/firebase/admin";
import { findUserById } from "@/features/users/repository";
import {
  DEFAULT_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { isTrustedOrigin } from "@/lib/auth/origin";

const schema = z.object({
  idToken: z.string().min(20),
});

export async function POST(request: Request) {
  // =========================================================
  // ORIGIN VALIDATION
  // =========================================================

  if (!isTrustedOrigin(request)) {
    console.error("[AUTH_SESSION] Origin rejected", {
      origin: request.headers.get("origin"),
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
      requestUrl: request.url,
      configuredAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      vercelUrl: process.env.VERCEL_URL,
    });

    return NextResponse.json(
      {
        error: "Permintaan login tidak diizinkan.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    // =========================================================
    // REQUEST BODY
    // =========================================================

    const body = schema.parse(await request.json());

    // =========================================================
    // VERIFY FIREBASE ID TOKEN
    // =========================================================

    const decoded = await adminAuth().verifyIdToken(body.idToken);

    // =========================================================
    // REQUIRE RECENT LOGIN
    // =========================================================

    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!decoded.auth_time || nowSeconds - decoded.auth_time > 5 * 60) {
      console.warn("[AUTH_SESSION] Login token too old", {
        uid: decoded.uid,
      });

      return NextResponse.json(
        {
          error: "Sesi login terlalu lama. Silakan login ulang.",
        },
        {
          status: 401,
        },
      );
    }

    // =========================================================
    // APP USER ACCESS
    // =========================================================

    const appUser = await findUserById(decoded.uid);

    if (!appUser) {
      console.warn("[AUTH_SESSION] User profile not found", {
        uid: decoded.uid,
        email: decoded.email,
      });

      return NextResponse.json(
        {
          error:
            "Akun Firebase ditemukan, tetapi akun belum terdaftar sebagai pengguna sistem.",
        },
        {
          status: 403,
        },
      );
    }

    if (appUser.status !== "ACTIVE") {
      console.warn("[AUTH_SESSION] User inactive", {
        uid: decoded.uid,
        email: decoded.email,
        status: appUser.status,
      });

      return NextResponse.json(
        {
          error: "Akun ini sedang tidak aktif. Hubungi Admin.",
        },
        {
          status: 403,
        },
      );
    }

    // =========================================================
    // CREATE SERVER SESSION
    // =========================================================

    const expiresIn = SESSION_MAX_AGE_SECONDS * 1000;

    const sessionCookie = await adminAuth().createSessionCookie(body.idToken, {
      expiresIn,
    });

    const response = NextResponse.json({
      ok: true,
    });

    response.cookies.set(
      process.env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE,
      sessionCookie,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    );

    console.info("[AUTH_SESSION] Login success", {
      uid: decoded.uid,
      email: decoded.email,
    });

    return response;
  } catch (error) {
    console.error("[AUTH_SESSION] Login failed", error);

    return NextResponse.json(
      {
        error: "Login gagal. Silakan periksa akun dan coba lagi.",
      },
      {
        status: 401,
      },
    );
  }
}
