import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
