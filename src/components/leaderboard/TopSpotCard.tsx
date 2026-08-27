import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleHelp, Crown, ShieldCheck, Trophy, Zap } from "lucide-react";
import type { LeaderboardRound, Product } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { CountdownTimer } from "@/components/leaderboard/CountdownTimer";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ButtonLink } from "@/components/ui/Button";

export function TopSpotCard({ leader, categoryName, round }: { leader: Product; categoryName?: string; round: LeaderboardRound }) {
  return <div className="relative overflow-hidden rounded-[28px] border border-[#e6ded8] bg-[#fffdfb] text-ink shadow-[0_18px_42px_rgba(20,33,43,.12)] sm:rounded-[32px]">
    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#fff1e8] blur-2xl" />
    <div className="pointer-events-none absolute -bottom-28 left-16 h-48 w-48 rounded-full bg-[#fff5dc] blur-3xl" />
    <div className="relative p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-black tracking-tight sm:text-base"><Zap size={21} fill="currentColor" className="shrink-0 text-coral" /><span className="truncate">THE DAILY BRAWL <span className="text-muted">·</span> <span className="text-coral">LIVE</span></span></div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#e5ddd7] bg-white px-3 py-2 text-xs font-bold text-muted shadow-[0_2px_8px_rgba(20,33,43,.04)] sm:px-4"><span className="h-2.5 w-2.5 rounded-full bg-coral" />Ends in <span className="font-black text-coral"><CountdownTimer endsAt={round.endsAt} compact /></span></span>
      </div>

      <div className="mt-6 grid gap-5 min-[420px]:grid-cols-[1.18fr_.82fr] min-[420px]:items-center sm:mt-8">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0"><div className="absolute -inset-3 rounded-[28px] bg-coral/15 blur-md" /><ProductLogo product={leader} size="xl" className="relative border-2 border-white shadow-[0_7px_0_rgba(255,107,74,.28)]" /></div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-coral/25 bg-coral/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-coral"><Crown size={13} fill="currentColor" />Current #1</div>
              <h2 className="display mt-2 truncate text-3xl font-black leading-none tracking-[-0.04em] sm:text-4xl">{leader.name}</h2>
              <p className="mt-2 truncate text-sm font-medium text-muted">{categoryName} <span className="text-coral">•</span> {leader.makerName}</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex h-40 w-36 items-center justify-center min-[420px]:h-44 min-[420px]:w-40"><Image src="/top-spot-badge-transparent.png" alt="Top spot badge" width={360} height={360} sizes="(min-width: 420px) 160px, 144px" priority className="h-auto w-36 object-contain min-[420px]:w-40" /></div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#efe2d9] bg-[#fffaf6] p-4 sm:mt-6 sm:p-5">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral"><ShieldCheck size={22} /></div><div className="min-w-0 flex-1"><p className="text-sm font-black uppercase tracking-[0.08em] text-coral">Verified sponsored placement</p><p className="mt-2 text-xs font-medium leading-5 text-muted">This position comes from a confirmed paid bid. Organic Brawl ratings and community votes remain separate.</p></div></div>
      </div>

      <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2 sm:mt-4">
        <div className="rounded-2xl border border-[#e8ded6] bg-white px-4 py-3 sm:px-5"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Highest active bid</p><p className="display mt-1 text-4xl font-black tracking-[-0.04em] text-coral sm:text-5xl">{formatMoney(leader.bidCents)}</p></div>
        <div className="flex min-h-[76px] items-center justify-center rounded-2xl border border-[#e8ded6] bg-white px-4 text-center text-xs font-bold text-muted sm:min-h-[88px]">Paid reach is measured separately from organic reputation.</div>
        <ButtonLink href={`/product/${leader.slug}`} variant="primary" size="lg" arrow className="min-h-[76px] rounded-2xl text-lg sm:min-h-[88px] sm:text-xl">View launch</ButtonLink>
      </div>
    </div>

    <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5df] bg-[#fffaf7] px-4 py-3.5 text-xs sm:px-6"><p className="inline-flex items-center gap-2 text-muted"><Trophy size={17} className="shrink-0 text-[#f0ac24]" />You&apos;re on top. <span className="font-bold text-coral">Defend it.</span> Make it yours.</p><Link href="/legal/advertising" className="inline-flex items-center gap-1 font-black text-ink">How it works <CircleHelp size={15} className="text-muted" /><ArrowRight size={14} /></Link></div>
  </div>;
}
