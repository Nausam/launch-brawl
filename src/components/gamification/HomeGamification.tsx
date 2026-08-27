import Link from "next/link";
import { ArrowUpRight, Flame, Swords, Trophy } from "lucide-react";
import type { ArenaSections } from "@/lib/gamification-data";
import type { Product, QuestProgress } from "@/lib/types";
import { BrawlCard } from "@/components/brawls/BrawlCard";
import { ButtonLink } from "@/components/ui/Button";

export function HomeGamification({ sections, quests, seasonLeader, products }: { sections: ArenaSections; quests: QuestProgress[]; seasonLeader?: { product: Product; standing: { seasonPoints?: number; points: number; division: string } }; products: Product[] }) {
  const quest = quests.find((item) => !item.completed) ?? quests[0];
  const byId = new Map(products.map((product) => [product.id, product]));

  return (
    <section className="relative overflow-hidden py-14 lg:py-20">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-16 h-80 w-80 rounded-full bg-[#e6f1fb]/55 blur-3xl" />
      <div className="relative mx-auto max-w-[1240px] px-5 lg:px-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              The competitive layer
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Swords size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">A living arena for good launches.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">Vote, predict, build a streak, and see which products earn their record over time.</p>
          </div>
          <ButtonLink href="/brawls" variant="secondary" size="lg" arrow className="self-start sm:self-end">Open Brawl Arena</ButtonLink>
        </div>

        <div className="relative mt-7 grid gap-4">
          {sections.live.slice(0, 2).map((brawl) => <BrawlSlot key={brawl.id} brawl={brawl} left={byId.get(brawl.productAId ?? brawl.leftProductId)} right={byId.get(brawl.productBId ?? brawl.rightProductId)} />)}
          {!sections.live.length ? (
            <p className="rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-8 text-sm text-muted">No Brawls are live right now.</p>
          ) : null}
        </div>

        {(quest || seasonLeader) ? (
          <div className="relative mt-5 grid gap-3 md:grid-cols-2">
            {quest ? (
              <Link href="/quests" className="group relative flex gap-4 overflow-hidden rounded-[20px] rounded-br-[8px] border-2 border-[#f4c788] bg-[linear-gradient(135deg,#fff8df_0%,#ffffff_100%)] p-4 transition hover:-translate-y-0.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-[#c58a0a]/30 bg-[#fff1b8] text-[#d78616]">
                  <Flame size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="eyebrow text-coral">Daily quest</span>
                    <span className="rounded-[10px] rounded-br-[4px] border border-[#f4c788] bg-[#fff4d6] px-2 py-0.5 text-xs font-bold text-[#c24b2a]">+{quest.xpReward} XP</span>
                  </span>
                  <span className="mt-2 block text-lg font-black text-ink group-hover:text-coral">{quest.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{quest.progress} / {quest.target} complete</span>
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-[8px] rounded-br-[3px] bg-paper-strong">
                    <span className="block h-full rounded-[8px] rounded-br-[3px] bg-coral transition-[width]" style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }} />
                  </span>
                </span>
              </Link>
            ) : null}
            {seasonLeader ? (
              <Link href="/seasons" className="group relative flex gap-4 overflow-hidden rounded-[20px] rounded-br-[8px] border-2 border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#ffffff_100%)] p-4 transition hover:-translate-y-0.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-[#c58a0a]/30 bg-[#fff1b8] text-[#c18b1e]">
                  <Trophy size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="eyebrow text-[#b17e18]">Season leader</span>
                    <span className="grid h-7 w-7 place-items-center rounded-[9px] rounded-br-[4px] border border-[#c58a0a]/25 bg-[#fff4d6] text-[#b17e18] transition group-hover:bg-ink group-hover:text-white">
                      <ArrowUpRight size={15} />
                    </span>
                  </span>
                  <span className="mt-2 block text-lg font-black text-ink group-hover:text-[#b17e18]">{seasonLeader.product.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{seasonLeader.standing.points} points · {seasonLeader.standing.division} division</span>
                </span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BrawlSlot({ brawl, left, right }: { brawl: ArenaSections["live"][number]; left?: Product; right?: Product }) {
  if (!left || !right) {
    return <div className="rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-8 text-sm text-muted">Live Brawl data is available, but its published products are still loading.</div>;
  }
  return <BrawlCard brawl={brawl} left={left} right={right} />;
}
