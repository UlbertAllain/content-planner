import "server-only";

function normalizeOrigin(value?: string | null) {
  if (!value) return null;

  try {
    const normalized = value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
    return new URL(normalized).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrigin(request: Request) {
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));
  if (!requestOrigin) return false;

  const trustedOrigins = new Set<string>();
  const currentRequestOrigin = normalizeOrigin(request.url);
  if (currentRequestOrigin) trustedOrigins.add(currentRequestOrigin);

  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  if (forwardedHost) {
    const forwardedOrigin = normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
    if (forwardedOrigin) trustedOrigins.add(forwardedOrigin);
  }

  for (const candidate of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ]) {
    const origin = normalizeOrigin(candidate);
    if (origin) trustedOrigins.add(origin);
  }

  return trustedOrigins.has(requestOrigin);
}
