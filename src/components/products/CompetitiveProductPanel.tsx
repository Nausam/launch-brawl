import Link from "next/link";
import { Crown, Flame, Gavel, Medal, ShieldAlert, Swords, Trophy, type LucideIcon } from "lucide-react";
import type { AchievementRarity, Brawl, LeaderboardRound, LeagueDivision, Product } from "@/lib/types";
import { findProductById } from "@/lib/repositories/catalog";
import { getArenaSections, getProductCompetitiveStats, getProductOrganicSignals, listProductAchievements, listProductBossReigns, listProductRivalries } from "@/lib/repositories/competitive";
import { calculateProductPower, getLevelForXp } from "@/lib/server/gamification";
import { cn, formatMoney, relativeTime } from "@/lib/utils";
import { BidDialog } from "@/components/leaderboard/BidDialog";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ButtonLink } from "@/components/ui/Button";

type RankTone = "gold" | "silver" | "bronze" | "rest";
type ResultMark = "W" | "L" | "D";

function divisionLabel(division: LeagueDivision) {
  switch (division) {
    case "GOLD":
      return "Gold";
    case "SILVER":
      return "Silver";
    case "BRONZE":
      return "Bronze";
    case "DIAMOND":
      return "Diamond";
    default: {
      const _exhaustive: never = division;
      return _exhaustive;
    }
  }
}

function rarityTone(rarity: AchievementRarity): RankTone {
  switch (rarity) {
    case "LEGENDARY":
      return "gold";
    case "EPIC":
      return "bronze";
    case "RARE":
      return "silver";
    case "UNCOMMON":
      return "rest";
    case "COMMON":
      return "rest";
    default: {
      const _exhaustive: never = rarity;
      return _exhaustive;
    }
  }
}

function resultTone(mark: ResultMark): RankTone {
  switch (mark) {
    case "W":
      return "gold";
    case "L":
      return "bronze";
    case "D":
      return "silver";
    default: {
      const _exhaustive: never = mark;
      return _exhaustive;
    }
  }
}

function placementTone(position: number, bidCents: number): RankTone {
  if (!position || !bidCents) return "rest";
  if (position === 1) return "gold";
  if (position === 2) return "silver";
  if (position === 3) return "bronze";
  return "rest";
}

function bidButtonVariant(tone: RankTone) {
  switch (tone) {
    case "gold":
      return "gold" as const;
    case "silver":
      return "blue" as const;
    case "bronze":
      return "bronze" as const;
    case "rest":
      return "default" as const;
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function rankStyle(tone: RankTone) {
  switch (tone) {
    case "gold":
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf6,#ffffff)] shadow-[2px_2px_0_#e4c15a]",
        medal: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]",
        badge: "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]",
      };
    case "silver":
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(180deg,#f7fbfe,#ffffff)] shadow-[2px_2px_0_#b7cfe0]",
        medal: "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]",
        badge: "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]",
      };
    case "bronze":
      return {
        frame: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf5,#ffffff)] shadow-[2px_2px_0_#e2b189]",
        medal: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf6,#f8e0c8,#e2b189)] text-[#9b5d2d]",
        badge: "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]",
      };
    case "rest":
      return {
        frame: "border-line bg-white shadow-[2px_2px_0_#e5e2da]",
        medal: "border-[#c9d7e4] bg-[linear-gradient(180deg,#ffffff,#eef4fa,#d6e3ef)] text-ink",
        badge: "border-line bg-paper text-muted",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function divisionEmblem(division: LeagueDivision) {
  switch (division) {
    case "GOLD":
      return rankStyle("gold");
    case "SILVER":
      return rankStyle("silver");
    case "BRONZE":
      return rankStyle("bronze");
    case "DIAMOND":
      return {
        frame: "border-[#9ec4e8] bg-[linear-gradient(180deg,#f4fbff,#e7f3fc)] shadow-[2px_2px_0_#9ec4e8]",
        medal: "border-[#9ec4e8] bg-[linear-gradient(180deg,#f8fcff,#e3f1fb,#b7d7ee)] text-[#1f4e73]",
        badge: "border-[#9ec4e8] bg-[#eef7fd] text-[#1f4e73]",
      };
    default: {
      const _exhaustive: never = division;
      return _exhaustive;
    }
  }
}

function brawlSides(brawl: Brawl) {
  return {
    a: brawl.productAId ?? brawl.leftProductId,
    b: brawl.productBId ?? brawl.rightProductId,
  };
}

function CombatStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[17px] rounded-br-[8px] border border-line bg-white px-4 py-3 shadow-[2px_2px_0_#e5e2da]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="display mt-1 text-2xl font-black tracking-[-0.04em] text-ink">{value}</p>
    </div>
  );
}

function HeatRow({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted">{label}</span>
        <span className="text-[11px] font-black tabular-nums text-ink">{value}</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-[8px] rounded-br-[3px] border border-line bg-paper-strong">
        <div className="h-full bg-gradient-to-r from-coral/50 via-coral to-coral-dark" style={{ width: `${Math.max(width, width > 0 ? 8 : 0)}%` }} />
      </div>
    </div>
  );
}

function IdentityChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[12px] rounded-br-[5px] border border-line bg-paper px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-[2px_2px_0_#e5e2da]">
      <Icon size={13} className="text-coral" />
      {label}
    </span>
  );
}

export async function CompetitiveProductPanel({ product, round }: { product: Product; round?: LeaderboardRound }) {
  const [stats, sections, achievements, organicSignals, bossReigns, rivalries] = await Promise.all([
    getProductCompetitiveStats(product.id),
    getArenaSections(),
    listProductAchievements(product.id),
    getProductOrganicSignals(product.id),
    listProductBossReigns(product.id),
    listProductRivalries(product.id),
  ]);
  const power = calculateProductPower(stats, {
    votes: organicSignals.votes,
    favorites: organicSignals.favorites,
    recentVotes: organicSignals.recentVotes,
    trendingMovement: organicSignals.trendingMovement,
    earlyDiscovery: organicSignals.earlyDiscovery,
  });
  const level = getLevelForXp(stats.productXp, true);
  const involved = (brawl: Brawl) => {
    const sides = brawlSides(brawl);
    return sides.a === product.id || sides.b === product.id;
  };
  const active = sections.live.find(involved);
  const recent = sections.recent.filter(involved).slice(0, 6);
  const nextThreshold = level.nextThreshold ?? level.currentThreshold + 1000;
  const xpIntoLevel = Math.max(0, stats.productXp - level.currentThreshold);
  const xpSpan = Math.max(1, nextThreshold - level.currentThreshold);
  const progress = Math.min(100, Math.round((xpIntoLevel / xpSpan) * 100));
  const xpToNext = Math.max(0, nextThreshold - stats.productXp);
  const listedRivalries = rivalries.slice(0, 3);
  const [opponents, rivalryOpponents] = await Promise.all([
    Promise.all(recent.map((brawl) => {
      const sides = brawlSides(brawl);
      return findProductById(sides.a === product.id ? sides.b : sides.a);
    })),
    Promise.all(listedRivalries.map((rivalry) => findProductById(rivalry.productAId === product.id ? rivalry.productBId : rivalry.productAId))),
  ]);
  const emblem = divisionEmblem(stats.division);
  const placeTone = placementTone(product.position, product.bidCents);
  const placeStyle = rankStyle(placeTone);

  return (
    <section id="record" className="relative mt-10 scroll-mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral">
            Fighter profile
            <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
              <Swords size={13} />
            </span>
          </div>
          <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink sm:text-4xl">Season card.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Rank, tape, and trophies for {product.name.trim()}. The paid board lives in the arena slot — it does not rewrite this record.</p>
        </div>
        {stats.isBoss ? (
          <span className="inline-flex items-center gap-1 rounded-[12px] rounded-br-[5px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-coral">
            <Crown size={13} />
            {product.categoryId.replaceAll("-", " ")} Boss
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,.75fr)]">
        <article className="relative overflow-hidden rounded-[24px] rounded-br-[10px] border border-line bg-white px-5 py-6 shadow-[2px_2px_0_#e5e2da] sm:px-6">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px] rounded-br-[8px]" aria-hidden>
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[22px] border-coral/10" />
            <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-coral/8 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="pointer-events-none absolute -inset-2 rounded-[28px] rounded-br-[12px] border border-dashed border-coral/35" />
              <ProductLogo product={product} size="xl" className="border-2 border-white shadow-none ring-1 ring-line" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Level {stats.productLevel}</p>
              <h3 className="display mt-1 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">{stats.productLevelTitle}</h3>
              <p className="mt-2 text-sm text-muted">{product.name} · {stats.totalBrawls} brawls on the tape</p>
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                  <span>{stats.productXp.toLocaleString()} XP</span>
                  <span>{xpToNext.toLocaleString()} to next</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-[8px] rounded-br-[3px] border border-line bg-paper-strong">
                  <div className="h-full bg-gradient-to-r from-coral to-[#ffd27a]" style={{ width: `${Math.max(progress, progress > 0 ? 8 : 0)}%` }} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <IdentityChip icon={Flame} label={`${stats.currentWinStreak} win streak`} />
                <IdentityChip icon={ShieldAlert} label={`${stats.upsetWins} upsets`} />
                <IdentityChip icon={Trophy} label={`${stats.bossDefenses} boss defenses`} />
              </div>
            </div>
          </div>
        </article>

        <article className={cn("relative flex flex-col items-center justify-center rounded-[24px] rounded-br-[10px] border px-5 py-6 text-center", emblem.frame)}>
          <span className={cn("grid h-16 w-16 place-items-center rounded-[18px] rounded-br-[8px] border", emblem.medal)}>
            <Medal size={28} />
          </span>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-muted">League division</p>
          <p className="display mt-1 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">{divisionLabel(stats.division)}</p>
          <p className="mt-2 text-sm font-black text-ink">{stats.seasonRank ? `Season rank #${stats.seasonRank}` : "Unranked this season"}</p>
          <p className="mt-1 text-xs text-muted">{stats.rating} brawl rating</p>
        </article>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CombatStat label="Record" value={`${stats.wins}-${stats.losses}-${stats.draws}`} />
        <CombatStat label="Win rate" value={`${stats.winRate}%`} />
        <CombatStat label="Season points" value={String(stats.seasonPoints)} />
        <CombatStat label="Longest streak" value={String(stats.longestWinStreak)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)]">
        <div className="h-full rounded-[17px] rounded-br-[8px] border border-line bg-white p-5 shadow-[2px_2px_0_#e5e2da] sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Match history</p>
              <p className="mt-1 text-sm font-black text-ink">Recent tape</p>
            </div>
            <span className="rounded-[12px] rounded-br-[5px] border border-line bg-paper px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted shadow-[2px_2px_0_#e5e2da]">
              {stats.totalBrawls} played
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {active ? (
              <article className="rounded-[17px] rounded-br-[8px] border border-coral/30 bg-coral/10 p-4">
                <p className="inline-flex items-center gap-2 rounded-[12px] rounded-br-[5px] border border-coral/30 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-coral">
                  <Swords size={13} />
                  Live now
                </p>
                <p className="mt-3 text-base font-black text-ink sm:text-lg">{active.prompt}</p>
                <ButtonLink href={`/brawl/${active.id}`} variant="primary" size="sm" arrow className="mt-4 w-fit">
                  Open matchup
                </ButtonLink>
              </article>
            ) : null}
            {recent.length ? recent.map((brawl, index) => {
              const opponent = opponents[index];
              const mark: ResultMark = brawl.winnerProductId === product.id ? "W" : brawl.draw ? "D" : "L";
              const style = rankStyle(resultTone(mark));
              const stamp = brawl.finalizedAt ?? brawl.endsAt;
              return (
                <Link key={brawl.id} href={`/brawl/${brawl.id}`} className={cn("flex items-center gap-3 rounded-[17px] rounded-br-[8px] border px-4 py-3 transition hover:-translate-y-0.5", style.frame)}>
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border text-sm font-black", style.medal)}>{mark}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-ink">vs {opponent?.name ?? "Unknown"}</span>
                    <span className="mt-0.5 block text-[11px] font-bold text-muted">{stamp ? relativeTime(stamp) : "Final"}{brawl.wasUpset ? " · upset" : ""}</span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted">{brawl.finalMarginPercent ?? 0}% mar.</span>
                </Link>
              );
            }) : active ? null : (
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 text-coral">
                  <Swords size={20} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-black text-ink">No brawls on the tape yet.</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-muted">Challenge this launch and the result lands here like a match history.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={cn("relative overflow-hidden rounded-[17px] rounded-br-[8px] border bg-white", placeStyle.frame)}>
          <article id="placement" className="scroll-mt-24 p-5 sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-[12px] rounded-br-[5px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
              Arena slot
              <Gavel size={12} />
            </div>
            <p className="mt-3 text-sm font-black text-ink">Paid board position</p>
            <p className="mt-1 text-xs leading-5 text-muted">Optional and labeled. Highest bid leads; purchased reach keeps running if the board moves.</p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Active bid</dt>
                <dd className="display mt-1 text-2xl font-black tracking-[-0.04em] text-ink">{formatMoney(product.bidCents)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Board spot</dt>
                <dd className="display mt-1 text-2xl font-black tracking-[-0.04em] text-ink">{product.position ? `#${product.position}` : "Open"}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              {round ? (
                <BidDialog
                  productId={product.id}
                  productName={product.name}
                  currentBidCents={product.bidCents}
                  roundId={round.id}
                  buttonLabel={product.position ? "Take this position" : "Enter the board"}
                  buttonVariant={bidButtonVariant(placeTone)}
                  buttonSize="compact"
                />
              ) : (
                <p className="text-xs leading-5 text-muted">There is no active sponsored round right now.</p>
              )}
              <ButtonLink href="/#daily-brawl" variant="ghost" size="sm" arrow className="w-fit px-0 hover:bg-transparent">
                Open the board
              </ButtonLink>
            </div>
          </article>

          <div className="border-t border-line px-5 py-5 sm:px-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Skill ratings</p>
            <p className="mt-1 text-sm font-black text-ink">Organic heat</p>
            <div className="mt-4 grid gap-3">
              <HeatRow label="Community" value={power.community} />
              <HeatRow label="Momentum" value={power.momentum} />
              <HeatRow label="Discovery" value={power.discovery} />
              <HeatRow label="Season" value={power.season} />
            </div>
          </div>

          <div className="border-t border-line px-5 py-5 sm:px-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Trophy cabinet</p>
            {achievements.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {achievements.map((achievement) => {
                  const style = rankStyle(rarityTone(achievement.rarity));
                  return (
                    <span key={achievement.id} title={achievement.description} className={cn("rounded-[12px] rounded-br-[5px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
                      {achievement.name}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-muted">No public trophies earned yet.</p>
            )}
          </div>
        </div>
      </div>

      {bossReigns.length || listedRivalries.length ? (
        <div className="mt-4 grid gap-3">
          {bossReigns.length ? (
            <div className="rounded-[17px] rounded-br-[8px] border border-line bg-white p-5 shadow-[2px_2px_0_#e5e2da]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Boss history</p>
              <div className="mt-3 grid gap-2">
                {bossReigns.slice(0, 3).map((reign) => (
                  <div key={reign.id} className="rounded-[14px] rounded-br-[6px] border border-line bg-paper px-4 py-3 text-xs">
                    <p className="font-black text-ink">{reign.endedAt ? "Former Boss" : "Current Boss"} · {reign.defenses} defenses</p>
                    <p className="mt-1 text-muted">Since {new Date(reign.startedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {listedRivalries.length ? (
            <div className="rounded-[17px] rounded-br-[8px] border border-line bg-white p-5 shadow-[2px_2px_0_#e5e2da]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Rivalries</p>
              <div className="mt-3 grid gap-2">
                {listedRivalries.map((rivalry, index) => {
                  const opponent = rivalryOpponents[index];
                  const ownWins = rivalry.productAId === product.id ? rivalry.productAWins : rivalry.productBWins;
                  const theirWins = rivalry.productAId === product.id ? rivalry.productBWins : rivalry.productAWins;
                  return (
                    <div key={rivalry.key} className="rounded-[14px] rounded-br-[6px] border border-line bg-paper px-4 py-3 text-xs">
                      <p className="font-black text-ink">vs {opponent?.name ?? "Unknown"}</p>
                      <p className="mt-1 text-muted">{ownWins}–{theirWins} · {rivalry.meetings} meetings{rivalry.leaderProductId === product.id ? " · leading" : ""}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
