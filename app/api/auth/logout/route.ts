import { NextResponse } from "next/server";
import { DEFAULT_SESSION_COOKIE } from "@/lib/auth/constants";
import { isTrustedOrigin } from "@/lib/auth/origin";

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(process.env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
