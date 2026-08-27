import { addDays, subHours } from "date-fns";
import { brawls as seedBrawls, categories, getProductById, products } from "@/lib/data";
import {
  calculateBrawlMetrics,
  calculateHotBrawlScore,
  calculateProductPower,
  calculateProductXp,
  calculateWinRate,
  getAchievementDefinitions,
  getDailyQuestInstances,
  getLeagueDivision,
  getLevelForXp,
  getRivalryKey,
  summarizeRivalry,
} from "@/lib/server/gamification";
import type {
  ActivityEvent,
  Brawl,
  BrawlBounty,
  BrawlChallenge,
  BrawlReport,
  BrawlSeason,
  BossReign,
  DailyPick,
  LeagueStanding,
  PlatformRecords,
  ProductCompetitiveStats,
  RivalrySummary,
  SeasonProductStats,
  UserGamification,
} from "@/lib/types";

const now = new Date();

function iso(date: Date): string {
  return date.toISOString();
}

function createProductStats(): Record<string, ProductCompetitiveStats> {
  return Object.fromEntries(products.map((product, index) => {
    const totalBrawls = 5 + (index % 8);
    const draws = index % 6 === 0 ? 1 : 0;
    const wins = Math.min(totalBrawls - draws, 2 + ((index * 3) % Math.max(2, totalBrawls - draws)));
    const losses = Math.max(0, totalBrawls - wins - draws);
    const rating = index === 0 ? 1482 : 1008 + ((products.length - index) % 9) * 38 + (index % 3) * 9;
    const upsetWins = index % 7 === 2 ? 2 : index % 5 === 0 ? 1 : 0;
    const closeWins = index % 4 === 0 ? 1 : 0;
    const bossWins = index === 3 ? 2 : index % 11 === 0 ? 1 : 0;
    const longestWinStreak = index === 0 ? 8 : Math.max(1, (wins % 5) + (index % 3));
    const productXp = calculateProductXp({ totalBrawls, wins, upsetWins, bossWins, longestWinStreak, seasonWins: index % 4 });
    const level = getLevelForXp(productXp, true);
    const provisionalBrawls = index % 6;
    const stats: ProductCompetitiveStats = {
      productId: product.id,
      rating,
      totalBrawls,
      wins,
      losses,
      draws,
      winRate: calculateWinRate(wins, losses, draws),
      currentWinStreak: index === 0 ? 4 : index % 5,
      longestWinStreak,
      currentLossStreak: index % 5 === 0 ? 0 : index % 3,
      longestLossStreak: Math.max(1, index % 4),
      upsetWins,
      closeWins,
      bossWins,
      bossDefenses: index === 0 ? 6 : index % 8 === 0 ? 2 : 0,
      seasonWins: index % 4,
      productXp,
      productLevel: level.level,
      productLevelTitle: level.title,
      division: getLeagueDivision(rating),
      seasonPoints: wins * 10 + draws * 4 + upsetWins * 5 + bossWins * 8,
      seasonRank: index + 1,
      provisionalBrawls,
      isBoss: index === 0,
    };
    return [product.id, stats];
  }));
}

export const productCompetitiveStats = createProductStats();

function enrichBrawl(brawl: Brawl): Brawl {
  const productAId = brawl.productAId ?? brawl.leftProductId;
  const productBId = brawl.productBId ?? brawl.rightProductId;
  const productA = getProductById(productAId);
  const metrics = calculateBrawlMetrics({ leftVotes: brawl.leftVotes, rightVotes: brawl.rightVotes, leadChanges: brawl.leadChanges ?? (brawl.status === "COMPLETED" ? 5 : 2) });
  const ratingA = productCompetitiveStats[productAId]?.rating ?? 1000;
  const ratingB = productCompetitiveStats[productBId]?.rating ?? 1000;
  const startsAt = brawl.startsAt ?? iso(brawl.status === "UPCOMING" || brawl.status === "SCHEDULED" ? subHours(new Date(brawl.endsAt), 24) : subHours(new Date(brawl.endsAt), 12));
  const currentLeaderProductId = brawl.status === "COMPLETED" ? brawl.winnerProductId : brawl.leftVotes >= brawl.rightVotes ? productAId : productBId;
  return {
    ...brawl,
    productAId,
    productBId,
    categoryId: brawl.categoryId ?? productA?.categoryId,
    startsAt,
    totalVotes: metrics.totalVotes,
    leadChanges: metrics.leadChanges,
    largestLeadProductId: brawl.largestLeadProductId ?? (brawl.leftVotes > brawl.rightVotes ? productAId : productBId),
    largestLeadPercent: brawl.largestLeadPercent ?? metrics.margin,
    closestMarginPercent: brawl.closestMarginPercent ?? metrics.margin,
    finalMarginPercent: brawl.finalMarginPercent ?? (brawl.status === "COMPLETED" ? metrics.margin : undefined),
    productARatingBefore: brawl.productARatingBefore ?? ratingA,
    productBRatingBefore: brawl.productBRatingBefore ?? ratingB,
    currentLeaderProductId,
    wasCloseBrawl: brawl.wasCloseBrawl ?? metrics.isClose,
    momentum: brawl.momentum ?? { leftVotes: brawl.leftVotes % 13, rightVotes: brawl.rightVotes % 11, leftPercent: 54, rightPercent: 46, label: currentLeaderProductId === productAId ? `${productA?.name ?? "Product A"} is surging` : `${getProductById(productBId)?.name ?? "Product B"} is surging`, windowMinutes: 15 },
  };
}

const completedHistory: Brawl[] = [
  { id: "brawl-history-1", prompt: "Which assistant earns a place in your workflow?", leftProductId: products[0].id, rightProductId: products[2].id, leftVotes: 1278, rightVotes: 1164, endsAt: iso(subHours(now, 74)), startsAt: iso(subHours(now, 98)), status: "COMPLETED", winnerProductId: products[0].id, loserProductId: products[2].id, finalMarginPercent: 4.7, wasCloseBrawl: false, seasonId: "season-1" },
  { id: "brawl-history-2", prompt: "Which tool would you recommend first?", leftProductId: products[3].id, rightProductId: products[7].id, leftVotes: 934, rightVotes: 925, endsAt: iso(subHours(now, 51)), startsAt: iso(subHours(now, 75)), status: "COMPLETED", winnerProductId: products[3].id, loserProductId: products[7].id, finalMarginPercent: 0.5, wasCloseBrawl: true, seasonId: "season-1" },
  { id: "brawl-history-3", prompt: "Which launch has the sharper point of view?", leftProductId: products[8].id, rightProductId: products[14].id, leftVotes: 612, rightVotes: 488, endsAt: iso(subHours(now, 27)), startsAt: iso(subHours(now, 51)), status: "COMPLETED", winnerProductId: products[8].id, loserProductId: products[14].id, finalMarginPercent: 11.8, seasonId: "season-1" },
  { id: "brawl-history-4", prompt: "Which product is ready for the next step?", leftProductId: products[1].id, rightProductId: products[4].id, leftVotes: 811, rightVotes: 802, endsAt: iso(subHours(now, 122)), startsAt: iso(subHours(now, 146)), status: "COMPLETED", winnerProductId: products[1].id, loserProductId: products[4].id, finalMarginPercent: 0.6, wasCloseBrawl: true, seasonId: "season-1" },
];

export const competitiveBrawls: Brawl[] = [...seedBrawls, ...completedHistory].map(enrichBrawl);

export function getBrawlById(id: string): Brawl | undefined {
  if (id === "current") return competitiveBrawls.find((brawl) => brawl.status === "LIVE");
  return competitiveBrawls.find((brawl) => brawl.id === id);
}

export function getLiveBrawls(): Brawl[] { return competitiveBrawls.filter((brawl) => brawl.status === "LIVE"); }
export function getUpcomingBrawls(): Brawl[] { return competitiveBrawls.filter((brawl) => brawl.status === "UPCOMING" || brawl.status === "SCHEDULED"); }
export function getCompletedBrawls(): Brawl[] { return competitiveBrawls.filter((brawl) => brawl.status === "COMPLETED"); }

export type ArenaSections = {
  live: Brawl[];
  hot: Brawl[];
  close: Brawl[];
  upsets: Brawl[];
  boss: Brawl[];
  starting: Brawl[];
  recent: Brawl[];
  rivalries: RivalrySummary[];
};

export function getArenaSections(): ArenaSections {
  const live = getLiveBrawls();
  const score = (brawl: Brawl) => {
    const metrics = calculateBrawlMetrics({ leftVotes: brawl.leftVotes, rightVotes: brawl.rightVotes, leadChanges: brawl.leadChanges });
    const ratingA = productCompetitiveStats[brawl.productAId ?? brawl.leftProductId]?.rating ?? 1000;
    const ratingB = productCompetitiveStats[brawl.productBId ?? brawl.rightProductId]?.rating ?? 1000;
    const upsetPotential = Math.max(0, Math.abs(ratingA - ratingB) - 100) / 5;
    return calculateHotBrawlScore({ totalVotes: metrics.totalVotes, recentVotes: (brawl.momentum?.leftVotes ?? 0) + (brawl.momentum?.rightVotes ?? 0), marginPercent: metrics.margin, leadChanges: brawl.leadChanges ?? 0, upsetPotential });
  };
  const rivalPairs = [[products[0].id, products[2].id], [products[3].id, products[7].id], [products[8].id, products[14].id]];
  return {
    live,
    hot: [...live].sort((a, b) => score(b) - score(a)),
    close: live.filter((brawl) => brawl.wasCloseBrawl),
    upsets: live.filter((brawl) => {
      const a = productCompetitiveStats[brawl.productAId ?? brawl.leftProductId]?.rating ?? 1000;
      const b = productCompetitiveStats[brawl.productBId ?? brawl.rightProductId]?.rating ?? 1000;
      const leader = brawl.leftVotes >= brawl.rightVotes ? a : b;
      const trailing = brawl.leftVotes >= brawl.rightVotes ? b : a;
      return trailing - leader >= 150;
    }),
    boss: live.filter((brawl) => brawl.bossBrawl || brawl.productAId === products[0].id || brawl.productBId === products[0].id),
    starting: getUpcomingBrawls(),
    recent: getCompletedBrawls().slice(0, 4),
    rivalries: rivalPairs.map(([a, b]) => summarizeRivalry(getCompletedBrawls(), a, b)),
  };
}

export function getProductCompetitiveStats(productId: string): ProductCompetitiveStats {
  return productCompetitiveStats[productId] ?? {
    productId,
    rating: 1000,
    totalBrawls: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    currentWinStreak: 0,
    longestWinStreak: 0,
    currentLossStreak: 0,
    longestLossStreak: 0,
    upsetWins: 0,
    closeWins: 0,
    bossWins: 0,
    bossDefenses: 0,
    seasonWins: 0,
    productXp: 0,
    productLevel: 1,
    productLevelTitle: "Rookie",
    division: "BRONZE",
    seasonPoints: 0,
    seasonRank: 0,
    provisionalBrawls: 0,
    isBoss: false,
  };
}

export function getProductPower(productId: string) {
  const product = getProductById(productId);
  return calculateProductPower(getProductCompetitiveStats(productId), { votes: product?.totalVotes ?? 0, favorites: product?.totalFavorites ?? 0, recentVotes: (product?.totalVotes ?? 0) % 20, trendingMovement: product?.trend === "up" ? 3 : product?.trend === "down" ? -1 : 1, earlyDiscovery: product ? Math.min(100, product.totalVotes / 10) : 0 });
}

export const currentSeason: BrawlSeason = {
  id: "season-1",
  name: "Season 1",
  slug: "season-1",
  startsAt: "2026-08-01T00:00:00.000Z",
  endsAt: "2026-09-01T00:00:00.000Z",
  status: "ACTIVE",
  current: true,
  createdAt: "2026-07-28T00:00:00.000Z",
};

export const seasons: BrawlSeason[] = [currentSeason, { id: "season-0", name: "Founders Season", slug: "founders-season", startsAt: "2026-07-01T00:00:00.000Z", endsAt: "2026-08-01T00:00:00.000Z", status: "COMPLETED", current: false, finalizedAt: "2026-08-01T02:00:00.000Z", championProductId: products[3].id, createdAt: "2026-06-28T00:00:00.000Z" }];

export function getSeasonBySlug(slug: string): BrawlSeason | undefined { return seasons.find((season) => season.slug === slug); }

export const seasonStandings: SeasonProductStats[] = products.map((product, index) => {
  const stats = getProductCompetitiveStats(product.id);
  return { id: `${currentSeason.id}_${product.id}`, seasonId: currentSeason.id, productId: product.id, categoryId: product.categoryId, ratingStart: Math.max(900, stats.rating - 60), ratingCurrent: stats.rating, points: stats.seasonPoints + Math.max(0, 12 - index), wins: stats.wins, losses: stats.losses, draws: stats.draws, bossWins: stats.bossWins, upsetWins: stats.upsetWins, rank: index + 1, division: stats.division, movement: index % 3 === 0 ? 2 : index % 3 === 1 ? -1 : 0, provisional: stats.provisionalBrawls < 5 };
}).sort((a, b) => b.points - a.points).map((entry, index) => ({ ...entry, rank: index + 1 }));

export function getLeagueStandings(categorySlug?: string): LeagueStanding[] {
  const categoryId = categories.find((category) => category.slug === categorySlug)?.id;
  return seasonStandings.filter((entry) => !categoryId || entry.categoryId === categoryId).map((entry) => ({ ...entry, productName: getProductById(entry.productId)?.name ?? "Unknown product", winRate: calculateWinRate(entry.wins, entry.losses, entry.draws), streak: getProductCompetitiveStats(entry.productId).currentWinStreak })).sort((a, b) => a.rank - b.rank);
}

export const demoUserGamification: UserGamification = {
  userId: "demo-user",
  xp: 18420,
  level: 24,
  levelTitle: "Tastemaker",
  tastemakerScore: 2180,
  earlyFinds: 32,
  totalPredictions: 83,
  correctPredictions: 65,
  predictionAccuracy: 78.3,
  currentPredictionStreak: 6,
  bestPredictionStreak: 12,
  questsCompleted: 42,
  dailyPicksPlayed: 28,
  dailyPickWins: 4,
  updatedAt: iso(now),
};

export const dailyQuests = getDailyQuestInstances(now);
export const demoQuestProgress = dailyQuests.map((quest, index) => ({ ...quest, progress: index === 0 ? 2 : index === 1 ? 5 : 0, completed: index === 1 }));

export const demoDailyPicks: DailyPick[] = [{ id: "2026-08-22_demo-user", date: "2026-08-22", userId: "demo-user", productIds: [products[0].id, products[3].id, products[8].id], submittedAt: iso(subHours(now, 3)), score: 124, rank: 38 }, { id: "2026-08-21_demo-user", date: "2026-08-21", userId: "demo-user", productIds: [products[1].id, products[2].id, products[4].id], submittedAt: iso(subHours(now, 27)), score: 96, rank: 62 }];

export const demoChallenges: BrawlChallenge[] = [{ id: "challenge-1", challengerUserId: "owner-1", challengerProductId: products[0].id, challengedProductId: products[2].id, challengedOwnerId: "owner-3", message: "Let's settle which calm assistant belongs in the daily stack.", status: "PENDING", createdAt: iso(subHours(now, 5)) }];

export const brawlBounties: BrawlBounty[] = [{ id: "bounty-boss-ai", type: "DEFEAT_BOSS", title: "Take down the AI League Boss", description: "Beat the current AI Boss in an organic Brawl.", targetProductId: products[0].id, categoryId: "ai", requirements: { minimumRatingGap: 100 }, xpReward: 100, achievementId: "product-boss-slayer", status: "ACTIVE", startsAt: iso(subHours(now, 12)), endsAt: iso(addDays(now, 7)) }, { id: "bounty-giant-killer", type: "GIANT_KILLER", title: "Find a giant killer", description: "Beat a product rated at least 200 points above you.", requirements: { ratingGap: 200 }, xpReward: 80, achievementId: "product-giant-killer", status: "ACTIVE", startsAt: iso(subHours(now, 12)), endsAt: iso(addDays(now, 7)) }];

export const bossReigns: BossReign[] = [{ id: "reign-ai-1", productId: products[0].id, categoryId: "ai", startedAt: "2026-08-10T09:00:00.000Z", defenses: 6 }];

export const activityEvents: ActivityEvent[] = [
  { id: "activity-1", type: "BRAWL_WIN", entityType: "BRAWL", entityId: "brawl-history-1", productId: products[0].id, metadata: { label: "SupaAI won a Brawl", ratingDelta: 18 }, visibility: "PUBLIC", createdAt: iso(subHours(now, 4)) },
  { id: "activity-2", type: "WIN_STREAK", entityType: "PRODUCT", entityId: products[0].id, productId: products[0].id, metadata: { label: "SupaAI reached a 4-win streak", streak: 4 }, visibility: "PUBLIC", createdAt: iso(subHours(now, 8)) },
  { id: "activity-3", type: "PREDICTION_STREAK", entityType: "USER", entityId: "demo-user", userId: "demo-user", metadata: { label: "Demo maker predicted six Brawls correctly", streak: 6 }, visibility: "PUBLIC", createdAt: iso(subHours(now, 10)) },
];

export const platformRecords: PlatformRecords = {
  mostBrawlWins: { productId: products[0].id, value: getProductCompetitiveStats(products[0].id).wins },
  longestWinStreak: { productId: products[0].id, value: getProductCompetitiveStats(products[0].id).longestWinStreak },
  highestRating: { productId: products[0].id, value: getProductCompetitiveStats(products[0].id).rating },
  mostBossDefenses: { productId: products[0].id, value: getProductCompetitiveStats(products[0].id).bossDefenses },
  biggestUpset: { brawlId: "brawl-history-1", value: 42.2 },
  closestBrawl: { brawlId: "brawl-history-2", value: 0.5 },
  mostVotedBrawl: { brawlId: "brawl-history-1", value: 2442 },
  topTastemaker: { userId: "demo-user", value: demoUserGamification.tastemakerScore },
};

export const demoBrawlReports: BrawlReport[] = getCompletedBrawls().map((brawl) => ({
  brawlId: brawl.id,
  winnerProductId: brawl.winnerProductId,
  loserProductId: brawl.loserProductId,
  draw: Boolean(brawl.draw),
  totalVotes: brawl.totalVotes ?? brawl.leftVotes + brawl.rightVotes,
  productAPercent: calculateBrawlMetrics({ leftVotes: brawl.leftVotes, rightVotes: brawl.rightVotes }).leftPercent,
  productBPercent: calculateBrawlMetrics({ leftVotes: brawl.leftVotes, rightVotes: brawl.rightVotes }).rightPercent,
  finalMarginPercent: brawl.finalMarginPercent ?? 0,
  leadChanges: brawl.leadChanges ?? 0,
  largestLeadProductId: brawl.largestLeadProductId,
  largestLeadPercent: brawl.largestLeadPercent ?? 0,
  ratingDeltaA: brawl.winnerProductId === brawl.productAId ? 18 : -18,
  ratingDeltaB: brawl.winnerProductId === brawl.productAId ? -18 : 18,
  highlight: brawl.wasCloseBrawl ? "Photo finish" : brawl.wasUpset ? "Upset victory" : "Key moment: the final stretch",
  generatedAt: iso(now),
}));

export const rivalrySummaries: RivalrySummary[] = [[products[0].id, products[2].id], [products[3].id, products[7].id], [products[8].id, products[14].id]].map(([a, b]) => summarizeRivalry(getCompletedBrawls(), a, b));

export function getRivalryByKey(key: string): RivalrySummary | undefined { return rivalrySummaries.find((rivalry) => rivalry.key === key || getRivalryKey(rivalry.productAId, rivalry.productBId) === key); }

export const achievementDefinitions = getAchievementDefinitions();

