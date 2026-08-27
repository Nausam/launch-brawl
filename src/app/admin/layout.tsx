import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/integrations/auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) { const admin = await requireAdmin(); if (!admin) redirect("/"); return <DashboardShell admin>{children}</DashboardShell>; }
