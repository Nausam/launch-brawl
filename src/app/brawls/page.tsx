import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Swords, Users, type LucideIcon } from "lucide-react";
import { listPublishedProducts } from "@/lib/repositories/catalog";
import { getArenaSections } from "@/lib/repositories/competitive";
import { cn, formatCompact } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { HowItWorksButton, type ArenaLane } from "@/app/brawls/BrawlArena";
import { BrawlArenaBoard } from "@/components/brawls/BrawlArenaBoard";

export const metadata: Metadata = { title: "Brawl Arena", description: "Live organic product matchups, close calls, upsets, and recent Brawl results." };
export const dynamic = "force-dynamic";

type ArenaStatTone = "coral" | "gold" | "blue";

const arenaJumps: Array<{ key: ArenaLane; label: string }> = [
  { key: "live", label: "Live" },
  { key: "close", label: "Too close" },
  { key: "upsets", label: "Upsets" },
  { key: "boss", label: "Boss" },
  { key: "hot", label: "Hot" },
  { key: "starting", label: "Starting soon" },
  { key: "recent", label: "Results" },
];

function arenaStatStyle(tone: ArenaStatTone) {
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

function ArenaStat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string; label: string; tone: ArenaStatTone }) {
  const style = arenaStatStyle(tone);
  return (
    <div className={cn("inline-flex min-h-12 min-w-[168px] items-center justify-between gap-3 rounded-[16px] rounded-br-[7px] border px-3 py-2", style.frame)}>
      <span className="pl-1 text-left">
        <span className={cn("display block text-2xl font-black leading-none tracking-[-0.04em]", style.value)}>{value}</span>
        <span className={cn("mt-1 block text-[10px] font-black uppercase tracking-[0.16em]", style.label)}>{label}</span>
      </span>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border", style.tile)}>
        <Icon size={15} />
      </span>
    </div>
  );
}

function countForLane(sections: Awaited<ReturnType<typeof getArenaSections>>, lane: ArenaLane) {
  switch (lane) {
    case "live":
      return sections.live.length;
    case "close":
      return sections.close.length;
    case "upsets":
      return sections.upsets.length;
    case "boss":
      return sections.boss.length;
    case "hot":
      return sections.hot.length;
    case "starting":
      return sections.starting.length;
    case "recent":
      return sections.recent.length;
    default: {
      const _exhaustive: never = lane;
      return _exhaustive;
    }
  }
}

export default async function BrawlsPage() {
  const [sections, products] = await Promise.all([getArenaSections(), listPublishedProducts()]);
  const visibleBrawls = [sections.live, sections.close, sections.upsets, sections.boss, sections.hot, sections.starting, sections.recent].flat();
  const uniqueBrawls = [...new Map(visibleBrawls.map((brawl) => [brawl.id, brawl])).values()];
  const totalVotes = uniqueBrawls.reduce((sum, brawl) => sum + brawl.leftVotes + brawl.rightVotes, 0);
  const jumps = arenaJumps.filter((jump) => countForLane(sections, jump.key) > 0);

  return (
    <>
      <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -left-[28%] -top-52 h-[500px] w-[156%] rounded-[50%] border-[18px] border-[#eef3f8]" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full border-[32px] border-coral/10" />
        <PageContainer className="relative pt-14 pb-3 lg:pt-20 lg:pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
                The arena is open
                <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                  <Swords size={13} />
                </span>
              </div>
              <h1 className="display mt-4 max-w-3xl text-5xl font-black leading-[.95] tracking-[-0.06em] text-ink sm:text-7xl">Where ideas meet their match.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">Live matchups, close calls, and upsets built from real community votes. Pick a side, make your case, and help the better idea move forward.</p>
            </div>
            <HowItWorksButton />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ArenaStat icon={Flame} value={String(sections.live.length)} label="Live brawls" tone="coral" />
            <ArenaStat icon={Swords} value={String(uniqueBrawls.length)} label="Matchups in view" tone="gold" />
            <ArenaStat icon={Users} value={formatCompact(totalVotes)} label="Votes counted" tone="blue" />
          </div>

          {jumps.length ? (
            <div className="mt-8 flex items-center gap-3">
              <div className="scrollbar-hide min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex w-max gap-2">
                  {jumps.map((jump, index) => (
                    <Link
                      key={jump.key}
                      href={`#${jump.key}`}
                      className={cn(
                        "shrink-0 rounded-[14px] rounded-br-[6px] border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition",
                        index === 0 ? "border-ink bg-ink text-white" : "border-line bg-paper text-muted hover:border-ink hover:text-ink",
                      )}
                    >
                      {jump.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </PageContainer>
      </section>
      <BrawlArenaBoard sections={sections} products={products} />
    </>
  );
}
