import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, CircleUserRound, ShieldCheck } from "lucide-react";
import { BrawlMark } from "@/components/brand/BrawlMark";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function DashboardShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  return (
    <div className={cn("min-h-[calc(100vh-72px)]", admin ? "bg-[#eef3f8]/70" : "bg-paper-strong/35")}>
      <div className={cn("mx-auto grid max-w-[1400px]", admin ? "lg:grid-cols-[284px_1fr]" : "lg:grid-cols-[264px_1fr]")}>
        <aside className={cn("relative hidden border-r border-line py-6 pl-6 pr-4 lg:flex lg:flex-col", admin ? "bg-[#f4f8fb]" : "bg-paper")}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className={cn("absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b", admin ? "from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]" : "from-[#ffd0c4] via-coral to-[#d9a21a]")} />
            <div className={cn("absolute -right-16 top-10 h-40 w-40 rounded-full border-[18px]", admin ? "border-[#d6e3ef]" : "border-coral/15")} />
          </div>
          <div className="relative px-2">
            <BrawlMark compact />
            <div className={cn("mt-5 inline-flex items-center rounded-[14px] rounded-br-[6px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]", admin ? "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]" : "border-coral/30 bg-coral/10 text-coral")}>
              {admin ? "Watch floor" : "Owner workshop"}
            </div>
            <p className="mt-3 max-w-[200px] text-[11px] leading-5 text-muted">
              {admin ? "Corridors for intake, arena, commerce, and systems." : "Slots for the bench, delivery, and inbox."}
            </p>
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto px-1">
            <DashboardNav admin={admin} orientation="rail" />
          </div>
          <div className={cn("relative mt-6 border-t pt-4", admin ? "border-[#c9d7e4]" : "border-line")}>
            {admin ? (
              <div className="mb-3 rounded-[16px] rounded-br-[7px] border border-[#172638] bg-[#172638] px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                Ops console live
                <span className="mt-1 block text-[9px] font-bold normal-case tracking-normal text-white/45">UTC midnight reset</span>
              </div>
            ) : null}
            <Link href="/" className="flex items-center gap-2 rounded-[14px] rounded-br-[6px] px-3 py-2 text-xs font-black text-muted transition hover:bg-paper-strong hover:text-ink">
              Back to Launch Brawl
              <ChevronRight size={14} />
            </Link>
            {admin ? (
              <Link href="/dashboard" className="mt-1 flex items-center gap-2 rounded-[14px] rounded-br-[6px] px-3 py-2 text-xs font-black text-coral transition hover:bg-coral/10">
                <ShieldCheck size={14} />
                Owner view
              </Link>
            ) : null}
          </div>
        </aside>
        <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center justify-between">
              <Link href="/">
                <BrawlMark compact />
              </Link>
              <ButtonLink href={admin ? "/admin/settings" : "/dashboard/settings"} variant="icon" size="icon" icon={<CircleUserRound size={17} />} className="h-9 w-9" aria-label="Account settings" />
            </div>
            <div className={cn("mt-3 inline-flex items-center rounded-[14px] rounded-br-[6px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]", admin ? "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]" : "border-coral/30 bg-coral/10 text-coral")}>
              {admin ? "Watch floor" : "Owner workshop"}
            </div>
            <div className="scrollbar-hide mt-4 -mx-5 overflow-x-auto px-5">
              <DashboardNav admin={admin} orientation="tape" />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
