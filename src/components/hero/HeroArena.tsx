import { Flame, MousePointer2, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { LeaderboardRound, Product } from "@/lib/types";
import { cn, formatCompact } from "@/lib/utils";
import { FeaturedLeaderCarousel } from "@/components/hero/FeaturedLeaderCarousel";
import { PageContainer } from "@/components/layout/PageContainer";

type HeroArenaProps = {
  leaders?: Product[];
  round?: LeaderboardRound;
  categoryNames?: Record<string, string>;
  liveBrawlCount: number;
  productsOnBoard: number;
  qualifiedClicks: number;
};

type HeroMetricTone = "coral" | "gold" | "blue";

type HeroMetricProps = {
  icon: ReactNode;
  value: string;
  label: string;
  tone: HeroMetricTone;
};

function metricStyle(tone: HeroMetricTone) {
  switch (tone) {
    case "coral":
      return {
        frame: "border-coral-dark bg-coral text-white shadow-[0_12px_28px_rgba(255,107,74,.28)]",
        value: "text-white",
        label: "text-white/80",
        tile: "border-white/30 bg-white/15 text-white",
      };
    case "gold":
      return {
        frame: "border-[#c58a0a] bg-[linear-gradient(180deg,#fff8df,#fff1b8)] text-[#7f570b] shadow-[0_12px_28px_rgba(201,148,32,.2)]",
        value: "text-[#7f570b]",
        label: "text-[#a26d08]",
        tile: "border-[#c58a0a]/30 bg-[#f0c54a]/40 text-[#8d610f]",
      };
    case "blue":
      return {
        frame: "border-ink bg-paper text-ink shadow-[0_10px_24px_rgba(20,33,43,.1)]",
        value: "text-ink",
        label: "text-[#2c668e]",
        tile: "border-ink/20 bg-[#eaf3fb] text-[#2c668e]",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function HeroMetric({ icon, value, label, tone }: HeroMetricProps) {
  const style = metricStyle(tone);
  return (
    <div className={cn("inline-flex min-h-12 min-w-[176px] items-center justify-between gap-3 rounded-[16px] rounded-br-[7px] border px-3 py-2", style.frame)}>
      <span className="pl-1 text-left">
        <span className={cn("display block text-2xl font-black leading-none tracking-[-0.04em]", style.value)}>{value}</span>
        <span className={cn("mt-1 block text-[10px] font-black uppercase tracking-[0.16em]", style.label)}>{label}</span>
      </span>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border", style.tile)}>{icon}</span>
    </div>
  );
}

export function HeroArena({ leaders = [], round, categoryNames, liveBrawlCount, productsOnBoard, qualifiedClicks }: HeroArenaProps) {
  return (
    <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
      <div className="pointer-events-none absolute -left-[35%] -top-64 h-[560px] w-[170%] rounded-[50%] border border-[#dbe4ed]" />
      <div className="pointer-events-none absolute -left-[28%] -top-52 h-[500px] w-[156%] rounded-[50%] border-[18px] border-[#eef3f8]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full border-[32px] border-coral/10" />

      <PageContainer className="relative py-14 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="eyebrow inline-flex items-center gap-2 text-coral"><Flame size={14} /> The arena is open</div>
          <h1 className="display mt-5 text-5xl font-black leading-[.94] tracking-[-0.065em] text-ink sm:text-7xl lg:text-[82px]">Where products<br /><span className="text-coral">compete for attention.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">Join the arena. Support the launches you believe in. Every vote and bid helps the best ideas earn their moment.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <HeroMetric icon={<Flame size={16} />} value={String(liveBrawlCount)} label="Live brawls" tone="coral" />
            <HeroMetric icon={<Trophy size={16} />} value={String(productsOnBoard)} label="Products on board" tone="gold" />
            <HeroMetric icon={<MousePointer2 size={16} />} value={formatCompact(qualifiedClicks)} label="Qualified clicks" tone="blue" />
          </div>
        </div>

        {leaders.length > 0 && round ? (
          <FeaturedLeaderCarousel leaders={leaders} round={round} categoryNames={categoryNames} />
        ) : (
          <div className="mx-auto mt-11 max-w-5xl border-y border-dashed border-line py-10 text-center">
            <div className="eyebrow text-coral">The board is waiting</div>
            <p className="mt-3 text-lg font-bold text-ink">No sponsored leader is live right now.</p>
            <p className="mt-2 text-sm text-muted">Be the first product to enter the next arena round.</p>
          </div>
        )}
      </PageContainer>
    </section>
  );
}
