import { Swords } from "lucide-react";
import type { ArenaSections } from "@/lib/gamification-data";
import type { Product } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { ArenaSection, type ArenaLane } from "@/app/brawls/BrawlArena";

const lanes: ArenaLane[] = ["live", "close", "upsets", "boss", "hot", "starting", "recent"];

function brawlsForLane(sections: ArenaSections, lane: ArenaLane) {
  switch (lane) {
    case "live":
      return sections.live;
    case "close":
      return sections.close;
    case "upsets":
      return sections.upsets;
    case "boss":
      return sections.boss;
    case "hot":
      return sections.hot;
    case "starting":
      return sections.starting;
    case "recent":
      return sections.recent;
    default: {
      const _exhaustive: never = lane;
      return _exhaustive;
    }
  }
}

export function BrawlArenaBoard({ sections, products }: { sections: ArenaSections; products: Product[] }) {
  const filled = lanes.map((lane) => ({ lane, brawls: brawlsForLane(sections, lane) })).filter((entry) => entry.brawls.length);
  const matchupCount = new Set(filled.flatMap((entry) => entry.brawls.map((brawl) => brawl.id))).size;

  return (
    <section className="relative overflow-hidden pt-5 pb-14 lg:pt-6 lg:pb-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-16 h-80 w-80 rounded-full bg-[#e6f1fb]/55 blur-3xl" />
      <PageContainer className="relative py-0 lg:py-0">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              The arena floor
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Swords size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">Pick a side. Read the split.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Live matchups lead. Close calls, upsets, and the record book sit underneath — earned from community votes, never paid rank.</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-xs font-bold text-muted sm:self-end">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" />
            {matchupCount} matchups on the floor
          </span>
        </div>

        {filled.length ? (
          <div className="relative mt-8 grid gap-8">
            {filled.map((entry) => (
              <ArenaSection key={entry.lane} lane={entry.lane} brawls={entry.brawls} products={products} />
            ))}
          </div>
        ) : (
          <div className="relative mt-8 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
            <div className="eyebrow text-coral">The arena is waiting</div>
            <p className="mt-3 text-lg font-bold text-ink">No Brawls are live right now.</p>
            <p className="mt-2 text-sm text-muted">The next matchup will appear here after an administrator schedules the arena.</p>
          </div>
        )}

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5 text-xs text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-coral" />The live split is organic. Paid reach never moves it.</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d8a52b]" />One vote per matchup. Predictions stay separate.</span>
        </div>
      </PageContainer>
    </section>
  );
}
