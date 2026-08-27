import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BarChart3, Clock3, Flame, Gauge, ShieldAlert, Swords, Trophy, Users } from "lucide-react";
import type { Brawl, BrawlReport, Product, ProductCompetitiveStats } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductLogo } from "@/components/products/ProductLogo";
import { Pill } from "@/components/ui/Pill";
import { TrustNote } from "@/components/marketing/TrustNote";
import { BrawlDetailControls } from "@/components/brawls/BrawlDetailControls";
import { LiveBrawlReadout } from "@/components/brawls/LiveBrawlReadout";

type BrawlDetailPageProps = {
  brawl: Brawl;
  left: Product;
  right: Product;
  leftStats: ProductCompetitiveStats;
  rightStats: ProductCompetitiveStats;
  report?: BrawlReport;
};

const statusCopy = {
  LIVE: "Live signal",
  UPCOMING: "On deck",
  SCHEDULED: "Scheduled",
  COMPLETED: "Final result",
  CANCELLED: "Cancelled",
} as const;

function ProductSide({ product, stats, align }: { product: Product; stats: ProductCompetitiveStats; align: "left" | "right" }) {
  const rightAligned = align === "right";

  return (
    <div className={`relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-[16px] rounded-br-[7px] border border-line bg-paper-strong/30 p-5 sm:p-6 ${rightAligned ? "text-right" : ""}`}>
      <div className={`flex items-center gap-4 ${rightAligned ? "justify-end" : ""}`}>
        <div className="rounded-[22px] border border-line bg-paper p-1"><ProductLogo product={product} size="lg" className="border-0 shadow-none" /></div>
        <div className="min-w-0">
          <div className={`eyebrow ${rightAligned ? "text-[#3f7ea5]" : "text-coral"}`}>{rightAligned ? "Defender" : "Challenger"}</div>
          <Link href={`/product/${product.slug}`} className="display mt-1 block truncate text-2xl font-black tracking-[-0.04em] text-ink transition hover:text-coral sm:text-3xl">{product.name}</Link>
          <p className="mt-1 text-xs font-bold text-muted">{stats.rating} rating <span className="text-coral">·</span> {stats.wins}-{stats.losses}-{stats.draws}</p>
        </div>
      </div>
      <div className={`mt-6 flex flex-wrap gap-2 text-[11px] font-black ${rightAligned ? "justify-end" : ""}`}>
        <Pill tone={rightAligned ? "blue" : "butter"}>{stats.division}</Pill>
        <Pill tone="neutral">🔥 {stats.currentWinStreak} streak</Pill>
      </div>
    </div>
  );
}

function DetailStat({ icon: Icon, label, value, tone = "coral" }: { icon?: typeof Users; label: string; value: string; tone?: "coral" | "gold" | "blue" }) {
  const tones = { coral: "text-coral", gold: "text-[#a66d00]", blue: "text-[#2c668e]" };
  return <div className="border border-line bg-paper p-4 sm:p-5"><div className="flex items-center gap-2 text-xs font-bold text-muted">{Icon && <Icon size={16} className={tones[tone]} />}{label}</div><p className="display mt-3 text-2xl font-black text-ink">{value}</p></div>;
}

export function BrawlDetailPageView({ brawl, left, right, leftStats, rightStats, report }: BrawlDetailPageProps) {
  const live = brawl.status === "LIVE";
  const totalVotes = Math.max(1, brawl.leftVotes + brawl.rightVotes);
  const hasReport = Boolean(report);

  return (
    <>
      <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -left-[32%] -top-64 h-[540px] w-[165%] rounded-[50%] border border-[#dbe4ed]" />
        <div className="pointer-events-none absolute -right-32 top-8 h-80 w-80 rounded-full border-[34px] border-[#eaf3fb]" />
        <div className="pointer-events-none absolute left-1/2 top-40 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
        <PageContainer className="relative py-10 lg:py-14">
          <Link href="/brawls" className="inline-flex items-center gap-2 text-xs font-bold text-muted transition hover:text-ink"><ArrowLeft size={14} /> Back to Brawl Arena</Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end lg:gap-16">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={live ? "coral" : brawl.status === "COMPLETED" ? "mint" : "blue"}><Swords size={13} className="mr-1" />{live ? "LIVE BRAWL" : brawl.status}</Pill>
                {brawl.wasCloseBrawl && <Pill tone="butter"><Flame size={13} className="mr-1" />Too close to call</Pill>}
                {brawl.wasUpset && <Pill tone="coral"><ShieldAlert size={13} className="mr-1" />Upset</Pill>}
              </div>
              <div className="eyebrow mt-7 flex items-center gap-2 text-coral"><Swords size={14} /> Product brawl</div>
              <h1 className="display mt-4 max-w-4xl text-5xl font-black leading-[.94] tracking-[-0.065em] text-ink sm:text-7xl">{brawl.prompt}</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted">An organic matchup between two published products. Sponsored exposure never changes votes, ratings, or league placement.</p>
            </div>
            <div className="border-l-2 border-coral pl-5 lg:mb-1">
              <div className="eyebrow text-coral">Matchup state</div>
              <p className="display mt-3 text-3xl font-black tracking-[-0.04em] text-ink">{statusCopy[brawl.status]}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{live ? "The board is still moving. Cast a vote before the final stretch." : hasReport ? "The result is recorded. Review the signal and the record it created." : "This matchup is waiting for the arena to open."}</p>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="pt-8 lg:pt-12">
        <section className="relative overflow-hidden border border-line bg-paper">
          <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#fff0bd]/45 blur-3xl" />
          <div className="pointer-events-none absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-[#e5f0fb]/55 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper-strong/30 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-[11px] rounded-br-[5px] bg-coral text-white"><Swords size={14} /></span>
              <div><div className="eyebrow text-coral">The face-off</div><p className="mt-0.5 text-xs font-bold text-muted">The community picks the signal</p></div>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-muted"><Clock3 size={14} className={live ? "text-coral" : "text-[#7c5cdb]"} /><span className="hidden sm:inline">Board closes</span> {live ? "tomorrow" : statusCopy[brawl.status]}</div>
          </div>

          <div className="relative grid items-stretch gap-5 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] lg:gap-5">
            <ProductSide product={left} stats={leftStats} align="left" />
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="h-7 w-px bg-gradient-to-b from-transparent via-[#e2b041] to-transparent lg:h-10" />
              <span className="grid h-16 w-16 rotate-45 place-items-center rounded-[19px] border border-coral/35 bg-coral/10"><span className="display -rotate-45 text-3xl font-black text-coral">VS</span></span>
              <span className="eyebrow w-full text-center text-muted">{brawl.status === "COMPLETED" ? "Final result" : "Make your call"}</span>
              <span className="h-7 w-px bg-gradient-to-b from-transparent via-[#e2b041] to-transparent lg:h-10" />
            </div>
            <ProductSide product={right} stats={rightStats} align="right" />
          </div>

          <div className="relative border-t border-line px-5 py-6 sm:px-7"><LiveBrawlReadout initialBrawl={brawl} left={left} right={right} /></div>

          <div className="relative border-t border-line bg-paper-strong/15 px-5 py-6 sm:px-7 sm:py-7"><BrawlDetailControls brawl={brawl} left={left} right={right} /></div>
        </section>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailStat icon={Users} label="Total votes" value={(brawl.totalVotes ?? totalVotes).toLocaleString()} />
          <DetailStat icon={Gauge} label="Brawl rating" value={`${leftStats.rating} · ${rightStats.rating}`} tone="gold" />
          <DetailStat icon={Flame} label="Momentum" value={brawl.momentum?.label ?? "Building"} tone="blue" />
          <DetailStat icon={BarChart3} label="Lead changes" value={String(brawl.leadChanges ?? 0)} />
        </div>

        {report ? (
          <section className="noise relative mt-8 overflow-hidden border-y border-line bg-paper-strong/30 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full border-[18px] border-[#eaf3fb]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4"><div><div className="eyebrow text-coral">Brawl report</div><h2 className="display mt-2 max-w-3xl text-3xl font-black tracking-[-0.04em] text-ink">{report.highlight}</h2></div><Trophy className="text-coral" size={24} /></div>
            <div className="relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><DetailStat label="Final margin" value={`${report.finalMarginPercent}%`} /><DetailStat label="Largest lead" value={`${report.largestLeadPercent}%`} /><DetailStat label="Rating change" value={`${report.ratingDeltaA > 0 ? "+" : ""}${report.ratingDeltaA} / ${report.ratingDeltaB > 0 ? "+" : ""}${report.ratingDeltaB}`} /><DetailStat label="Generated from" value={`${report.totalVotes.toLocaleString()} votes`} /></div>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 border-y border-line bg-paper-strong/25 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"><div><div className="eyebrow text-coral">Live readout</div><h2 className="display mt-2 text-3xl font-black tracking-[-0.04em] text-ink">Every vote is still in play.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">The split updates as the community chooses. Your vote is separate from paid reach and helps the makers understand what resonates.</p></div><Link href="/about" className="inline-flex items-center gap-2 text-sm font-bold text-ink transition hover:text-coral">Read the rules <ArrowUpRight size={16} /></Link></section>
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="border border-line bg-paper p-6 sm:p-8"><div className="eyebrow text-coral">What this measures</div><h2 className="display mt-2 text-2xl font-black text-ink">Organic competition</h2><p className="mt-3 text-sm leading-6 text-muted">A vote is counted once per signed-in user, validated on the server, and stored with a deterministic ID. Money can buy labeled exposure, never a Brawl outcome.</p></div>
          <div className="border border-line bg-paper-strong/55 p-6 sm:p-8"><div className="eyebrow text-coral">Stakes</div><h2 className="display mt-2 text-2xl font-black text-ink">Ratings, records, and reputation</h2><p className="mt-3 text-sm leading-6 text-muted">Completed Brawls update Elo-style ratings, win rates, streaks, season points, achievements, and rivalry history exactly once.</p></div>
        </section>
      </PageContainer>
      <PageContainer className="pt-8 lg:pt-10"><TrustNote variant="rail" /></PageContainer>
    </>
  );
}
