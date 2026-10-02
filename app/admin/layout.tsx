import { auth } from "@/lib/auth"
import { AppShell } from "@/components/shell/app-shell"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <AppShell user={session?.user}>
      {children}
    </AppShell>
  );
}
