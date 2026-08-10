import { NextResponse } from "next/server";
import { createPublicIdeaService } from "@/features/ideas/service";

function redirectToHome(request: Request, query: string) {
  const url = new URL("/", request.url);
  url.search = query;
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // Honeypot: bots that fill this hidden field are silently treated as successful.
    if (String(formData.get("website") || "").trim()) return redirectToHome(request, "?sent=1");

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = forwarded || request.headers.get("x-real-ip") || "local";

    await createPublicIdeaService({
      companyId: String(formData.get("companyId") || ""),
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || "").trim() || undefined,
      senderName: String(formData.get("senderName") || "").trim() || undefined,
    }, ipAddress);

    return redirectToHome(request, "?sent=1");
  } catch (error) {
    if (error instanceof Error && error.message === "PUBLIC_IDEA_RATE_LIMIT") return redirectToHome(request, "?error=rate");
    return redirectToHome(request, "?error=invalid");
  }
}
