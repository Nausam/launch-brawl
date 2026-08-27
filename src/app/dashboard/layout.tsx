import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { reconcilePendingFreemiusPurchases } from "@/lib/repositories/payments";

export const metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAppUser();
  if (user?.email) await reconcilePendingFreemiusPurchases(user.email);
  return <DashboardShell>{children}</DashboardShell>;
}
