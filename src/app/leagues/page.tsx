import type { Metadata } from "next";
import Link from "next/link";
import { Layers3, Shield, Trophy, type LucideIcon } from "lucide-react";
import type { Category, LeagueStanding } from "@/lib/types";
import { getProductsByIds, listCategories } from "@/lib/repositories/catalog";
import { getCurrentSeason, getLeagueStandings } from "@/lib/repositories/competitive";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { LeagueLadderBoard, type LeagueLadder } from "@/components/leagues/LeagueLadderBoard";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Category Leagues", description: "Organic category divisions, standings, Boss products, and promotion races." };
export const dynamic = "force-dynamic";

type LeagueStatTone = "coral" | "gold" | "blue";

function leagueStatStyle(tone: LeagueStatTone) {
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

function LeagueStat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string; label: string; tone: LeagueStatTone }) {
  const style = leagueStatStyle(tone);
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

function standingsForCategory(standings: LeagueStanding[], category: Category) {
  return standings
    .filter((entry) => entry.categoryId === category.id || entry.categoryId === category.slug)
    .sort((a, b) => a.rank - b.rank || b.points - a.points || b.ratingCurrent - a.ratingCurrent)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export default async function LeaguesPage() {
  const [categories, standings, season] = await Promise.all([listCategories(), getLeagueStandings(), getCurrentSeason()]);
  const ladders: LeagueLadder[] = categories.map((category) => ({ category, standings: standingsForCategory(standings, category) }));
  const products = await getProductsByIds(standings.map((standing) => standing.productId));
  const uniqueOnLadders = new Set(standings.map((standing) => standing.productId)).size;
  const filled = ladders.filter((ladder) => ladder.standings.length);
  const climbing = standings.filter((standing) => standing.movement > 0).length;

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
                Earned placement
                <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                  <Trophy size={13} />
                </span>
              </div>
              <h1 className="display mt-4 max-w-3xl text-5xl font-black leading-[.95] tracking-[-0.06em] text-ink sm:text-7xl">Every category has a ladder.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">Divisions, bosses, and promotion races built from completed Brawls. No paid placement. No shortcut to Diamond.</p>
            </div>
            <ButtonLink href={season ? `/seasons/${season.slug}` : "/seasons"} variant="dark" size="md" arrow>
              {season ? "Open this season" : "See seasons"}
            </ButtonLink>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <LeagueStat icon={Trophy} value={String(filled.length)} label="Live ladders" tone="coral" />
            <LeagueStat icon={Layers3} value={String(uniqueOnLadders)} label="Products climbing" tone="gold" />
            <LeagueStat icon={Shield} value={String(climbing)} label="Moving up" tone="blue" />
          </div>

          {filled.length ? (
            <div className="mt-8 flex items-center gap-3">
              <div className="scrollbar-hide min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex w-max gap-2">
                  {filled.map((ladder, index) => (
                    <Link
                      key={ladder.category.id}
                      href={`#${ladder.category.slug}`}
                      className={cn(
                        "shrink-0 rounded-[14px] rounded-br-[6px] border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition",
                        index === 0 ? "border-ink bg-ink text-white" : "border-line bg-paper text-muted hover:border-ink hover:text-ink",
                      )}
                    >
                      {ladder.category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </PageContainer>
      </section>
      <LeagueLadderBoard ladders={ladders} products={products} />
    </>
  );
}
