import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { getCurrentRound, getLeaderboard, getTrendingProducts, listCategories } from "@/lib/repositories/catalog";
import { getArenaSections, getQuestProgress, seasonLeader } from "@/lib/repositories/competitive";
import { HeroArena } from "@/components/hero/HeroArena";
import { PageContainer } from "@/components/layout/PageContainer";
import { DailyBrawlBoard } from "@/components/leaderboard/DailyBrawlBoard";
import { TrendingMomentum } from "@/components/discovery/TrendingMomentum";
import { HomeGamification } from "@/components/gamification/HomeGamification";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { getPlatformSettings } from "@/lib/server/settings";
import { calculateCampaignImpressions } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [round, leaderboard, trending, settings, categories] = await Promise.all([
    getCurrentRound(),
    getLeaderboard(),
    getTrendingProducts(),
    getPlatformSettings(),
    listCategories(),
  ]);
  const [sections, quests, leaderEntry] = await Promise.all([getArenaSections(), getQuestProgress(), seasonLeader()]);
  const featuredLeaders = leaderboard.slice(0, 3);
  const categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));
  return (
    <>
      <HeroArena
        leaders={featuredLeaders}
        round={round}
        categoryNames={categoryNames}
        liveBrawlCount={sections.live.length}
        productsOnBoard={leaderboard.length}
        qualifiedClicks={leaderboard.reduce((sum, product) => sum + product.totalQualifiedClicks, 0)}
      />
      <PageContainer className="pt-2 lg:pt-4">
        <div id="daily-brawl" className="scroll-mt-24">
          {round ? <DailyBrawlBoard products={leaderboard} round={round} /> : <EmptyState title="The top spot is open" description="There is no sponsored round open right now." />}
        </div>
      </PageContainer>
  <HomeGamification sections={sections} quests={quests} seasonLeader={leaderEntry} products={[...leaderboard, ...trending]} />
      <TrendingMomentum products={trending} />
      <section className="noise relative overflow-hidden border-y border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -right-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full border-[42px] border-[#fff0c8]/70" />
        <div className="pointer-events-none absolute -left-48 -top-40 h-80 w-80 rounded-full border-[32px] border-coral/10" />
        <PageContainer className="relative py-14 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
            <div>
              <div className="eyebrow text-coral">Sponsored reach · measured</div>
              <h2 className="display mt-4 max-w-xl text-4xl font-black leading-[.96] tracking-[-0.055em] text-ink sm:text-6xl">Outbid? Your campaign keeps running.</h2>
              <p className="mt-5 max-w-lg text-sm leading-6 text-muted sm:text-base">Every successful bid includes promotional impression credits. If the board moves, your purchased allocation does not disappear.</p>
              <ButtonLink href="/pricing" variant="dark" size="md" arrow className="mt-7">See the transparent model</ButtonLink>
            </div>
            <div className="relative border-y border-line py-6 sm:py-8">
              <div className="flex items-center justify-between gap-4"><span className="eyebrow text-[#a66d00]">Campaign transmission</span><span className="inline-flex items-center gap-2 text-xs font-bold text-muted"><Sparkles size={15} className="text-coral" />Attached to every paid bid</span></div>
              <div className="mt-8 grid grid-cols-2 gap-x-7 gap-y-7 sm:grid-cols-4">
                <div className="border-l-2 border-[#d8a52b] pl-4"><p className="eyebrow text-muted">Model input</p><p className="display mt-2 text-3xl font-black text-ink">$50</p><p className="mt-1 text-xs text-muted">example bid</p></div>
                <div className="border-l-2 border-[#75a8cf] pl-4"><p className="eyebrow text-muted">Promo allocation</p><p className="display mt-2 text-3xl font-black text-ink">{calculateCampaignImpressions(5000, settings.promoImpressionsPerDollar).toLocaleString()}</p><p className="mt-1 text-xs text-muted">impressions</p></div>
                <div className="border-l-2 border-[#b87949] pl-4"><p className="eyebrow text-muted">Position</p><p className="mt-2 text-lg font-black text-ink">Changes live</p><p className="mt-1 text-xs text-muted">bid decides rank</p></div>
                <div className="border-l-2 border-coral pl-4"><p className="eyebrow text-muted">Exposure</p><p className="mt-2 text-lg font-black text-ink">Keeps delivering</p><p className="mt-1 text-xs text-muted">allocation stays active</p></div>
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-line pt-5 text-xs font-bold text-muted"><span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" /><span>Live allocation</span><span className="h-px flex-1 bg-line" /><span className="text-ink">Position can move. Reach does not vanish.</span></div>
            </div>
          </div>
        </PageContainer>
      </section>
      <PageContainer>
        <div className="flex items-center justify-between border-t border-line pt-6 text-xs text-muted">
          <span>Built for indie hackers, studios, and small teams.</span>
          <Link href="/about" className="inline-flex items-center gap-1 font-bold text-ink">Why Launch Brawl? <ChevronRight size={14} /></Link>
        </div>
      </PageContainer>
    </>
  );
}
