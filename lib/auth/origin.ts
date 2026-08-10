import "server-only";

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin || !configured) return false;

  try {
    return new URL(origin).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}
