import "server-only";

function normalizeOrigin(value?: string | null) {
  if (!value) return null;

  try {
    const normalized =
      value.startsWith("http://") || value.startsWith("https://")
        ? value
        : `https://${value}`;

    return new URL(normalized).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrigin(request: Request) {
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));

  if (!requestOrigin) {
    return false;
  }

  const trustedOrigins = new Set<string>();

  // =========================================================
  // 1. ORIGIN DARI REQUEST YANG SEDANG DILAYANI
  // =========================================================

  const currentRequestOrigin = normalizeOrigin(request.url);

  if (currentRequestOrigin) {
    trustedOrigins.add(currentRequestOrigin);
  }

  // =========================================================
  // 2. HOST YANG DITERUSKAN OLEH PROXY / VERCEL
  // =========================================================

  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  const forwardedProto =
    request.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (forwardedHost) {
    const forwardedOrigin = normalizeOrigin(
      `${forwardedProto}://${forwardedHost}`,
    );

    if (forwardedOrigin) {
      trustedOrigins.add(forwardedOrigin);
    }
  }

  // =========================================================
  // 3. URL APLIKASI YANG KITA KONFIGURASIKAN
  // =========================================================

  const configuredAppUrl = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);

  if (configuredAppUrl) {
    trustedOrigins.add(configuredAppUrl);
  }

  // =========================================================
  // 4. URL OTOMATIS DARI VERCEL
  // =========================================================

  const vercelProductionUrl = normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );

  if (vercelProductionUrl) {
    trustedOrigins.add(vercelProductionUrl);
  }

  const vercelBranchUrl = normalizeOrigin(process.env.VERCEL_BRANCH_URL);

  if (vercelBranchUrl) {
    trustedOrigins.add(vercelBranchUrl);
  }

  const vercelDeploymentUrl = normalizeOrigin(process.env.VERCEL_URL);

  if (vercelDeploymentUrl) {
    trustedOrigins.add(vercelDeploymentUrl);
  }

  // =========================================================
  // FINAL CHECK
  // =========================================================

  return trustedOrigins.has(requestOrigin);
}
