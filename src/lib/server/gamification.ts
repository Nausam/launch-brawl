import type {
  AchievementDefinition,
  Brawl,
  BrawlReport,
  BrawlResult,
  DailyQuest,
  FeatureFlags,
  LeagueDivision,
  MomentumSnapshot,
  ProductCompetitiveStats,
  RivalrySummary,
  UserGamification,
  DailyQuestTemplate,
} from "@/lib/types";

export const GAMIFICATION_CONFIG = {
  rating: {
    starting: 1000,
    kFactor: 32,
    upsetExpectedThreshold: 0.35,
    upsetMinimumRatingGap: 150,
  },
  brawls: {
    closeMarginPercent: 3,
    closeMinimumVotes: 20,
    momentumWindowMinutes: 15,
    predictionLockPercent: 0.8,
  },
  xp: {
    userVote: 2,
    dailyQuest: 15,
    correctPrediction: 5,
    dailyPick: 3,
    productParticipation: 8,
    productWin: 20,
    upsetBonus: 12,
    bossWinBonus: 16,
  },
  seasonPoints: {
    win: 10,
    draw: 4,
    upsetBonus: 5,
    bossWinBonus: 8,
    streak3Bonus: 3,
    streak5Bonus: 6,
    streak10Bonus: 15,
  },
  levels: [
    { level: 1, title: "Scout", xp: 0 },
    { level: 5, title: "Explorer", xp: 500 },
    { level: 10, title: "Analyst", xp: 1_500 },
    { level: 20, title: "Tastemaker", xp: 4_000 },
    { level: 35, title: "Veteran", xp: 9_000 },
    { level: 50, title: "Oracle", xp: 18_000 },
  ],
  productLevels: [
    { level: 1, title: "Rookie", xp: 0 },
    { level: 5, title: "Rising", xp: 300 },
    { level: 10, title: "Contender", xp: 1_200 },
    { level: 18, title: "Elite", xp: 3_000 },
    { level: 30, title: "Champion", xp: 7_000 },
    { level: 50, title: "Legend", xp: 15_000 },
  ],
  leagueDivisions: [
    { name: "BRONZE", minimumRating: 0 },
    { name: "SILVER", minimumRating: 1050 },
    { name: "GOLD", minimumRating: 1200 },
    { name: "DIAMOND", minimumRating: 1400 },
  ] as Array<{ name: LeagueDivision; minimumRating: number }>,
  boss: {
    minimumRating: 1250,
    minimumBrawls: 5,
    minimumRecentBrawls: 2,
  },
  flags: {
    submissionsEnabled: true,
    votingEnabled: true,
    biddingEnabled: false,
    campaignDeliveryEnabled: false,
    brawlsEnabled: true,
    challengesEnabled: true,
    predictionsEnabled: true,
    questsEnabled: true,
    dailyPicksEnabled: true,
    leaguesEnabled: true,
    bossBrawlsEnabled: true,
    bountiesEnabled: true,
  } satisfies FeatureFlags,
} as const;

export type RatingResult = {
  expectedA: number;
  expectedB: number;
  deltaA: number;
  deltaB: number;
  newRatingA: number;
  newRatingB: number;
};

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

export function calculateBrawlRatingChange({
  ratingA,
  ratingB,
  result,
  kFactor = GAMIFICATION_CONFIG.rating.kFactor,
}: {
  ratingA: number;
  ratingB: number;
  result: BrawlResult;
  kFactor?: number;
}): RatingResult {
  const expectedA = calculateExpectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  const actualA = result === "A_WIN" ? 1 : result === "B_WIN" ? 0 : 0.5;
  const deltaA = Math.round(kFactor * (actualA - expectedA));
  const deltaB = deltaA === 0 ? 0 : -deltaA;
  return {
    expectedA,
    expectedB,
    deltaA,
    deltaB,
    newRatingA: ratingA + deltaA,
    newRatingB: ratingB + deltaB,
  };
}

export function calculateUpsetScore({
  winnerRating,
  loserRating,
  expectedWinnerProbability,
}: {
  winnerRating: number;
  loserRating: number;
  expectedWinnerProbability: number;
}): number {
  const ratingGap = Math.max(0, loserRating - winnerRating);
  const surprise = Math.max(0, 1 - expectedWinnerProbability);
  return Math.round(Math.min(100, surprise * 70 + Math.min(30, ratingGap / 10)) * 10) / 10;
}

export function isUpset({
  winnerRating,
  loserRating,
  expectedWinnerProbability,
}: {
  winnerRating: number;
  loserRating: number;
  expectedWinnerProbability: number;
}): boolean {
  return (
    loserRating - winnerRating >= GAMIFICATION_CONFIG.rating.upsetMinimumRatingGap &&
    expectedWinnerProbability < GAMIFICATION_CONFIG.rating.upsetExpectedThreshold
  );
}

export function calculateWinRate(wins: number, losses: number, draws: number): number {
  const total = wins + losses + draws;
  return total === 0 ? 0 : Math.round(((wins + draws * 0.5) / total) * 10_000) / 100;
}

export function updateWinLossStreaks(
  stats: Pick<ProductCompetitiveStats, "currentWinStreak" | "longestWinStreak" | "currentLossStreak" | "longestLossStreak">,
  result: BrawlResult,
): Pick<ProductCompetitiveStats, "currentWinStreak" | "longestWinStreak" | "currentLossStreak" | "longestLossStreak"> {
  const win = result === "A_WIN";
  const loss = result === "B_WIN";
  const currentWinStreak = win ? stats.currentWinStreak + 1 : 0;
  const currentLossStreak = loss ? stats.currentLossStreak + 1 : 0;
  return {
    currentWinStreak,
    longestWinStreak: Math.max(stats.longestWinStreak, currentWinStreak),
    currentLossStreak,
    longestLossStreak: Math.max(stats.longestLossStreak, currentLossStreak),
  };
}

export function calculateSeasonPoints({
  result,
  upset,
  bossWin,
  resultingWinStreak,
}: {
  result: BrawlResult;
  upset?: boolean;
  bossWin?: boolean;
  resultingWinStreak?: number;
}): number {
  let points = result === "A_WIN" || result === "B_WIN" ? GAMIFICATION_CONFIG.seasonPoints.win : GAMIFICATION_CONFIG.seasonPoints.draw;
  if (upset) points += GAMIFICATION_CONFIG.seasonPoints.upsetBonus;
  if (bossWin) points += GAMIFICATION_CONFIG.seasonPoints.bossWinBonus;
  if (resultingWinStreak === 3) points += GAMIFICATION_CONFIG.seasonPoints.streak3Bonus;
  if (resultingWinStreak === 5) points += GAMIFICATION_CONFIG.seasonPoints.streak5Bonus;
  if (resultingWinStreak === 10) points += GAMIFICATION_CONFIG.seasonPoints.streak10Bonus;
  return points;
}

export function getLevelForXp(xp: number, product = false): { level: number; title: string; currentThreshold: number; nextThreshold?: number } {
  const table = product ? GAMIFICATION_CONFIG.productLevels : GAMIFICATION_CONFIG.levels;
  const current = [...table].reverse().find((entry) => xp >= entry.xp) ?? table[0];
  const next = table.find((entry) => entry.xp > current.xp);
  return { level: current.level, title: current.title, currentThreshold: current.xp, nextThreshold: next?.xp };
}

export function calculateProductXp({
  totalBrawls,
  wins,
  upsetWins,
  bossWins,
  longestWinStreak,
  seasonWins,
}: Pick<ProductCompetitiveStats, "totalBrawls" | "wins" | "upsetWins" | "bossWins" | "longestWinStreak" | "seasonWins">): number {
  return (
    totalBrawls * GAMIFICATION_CONFIG.xp.productParticipation +
    wins * GAMIFICATION_CONFIG.xp.productWin +
    upsetWins * GAMIFICATION_CONFIG.xp.upsetBonus +
    bossWins * GAMIFICATION_CONFIG.xp.bossWinBonus +
    Math.max(0, longestWinStreak - 2) * 10 +
    seasonWins * 15
  );
}

export function calculateBrawlMetrics({
  leftVotes,
  rightVotes,
  leadChanges = 0,
  minimumVotes = GAMIFICATION_CONFIG.brawls.closeMinimumVotes,
}: {
  leftVotes: number;
  rightVotes: number;
  leadChanges?: number;
  minimumVotes?: number;
}) {
  const totalVotes = Math.max(0, leftVotes + rightVotes);
  const leftPercent = totalVotes === 0 ? 50 : Math.round((leftVotes / totalVotes) * 1000) / 10;
  const rightPercent = Math.round((100 - leftPercent) * 10) / 10;
  const margin = Math.round(Math.abs(leftPercent - rightPercent) * 10) / 10;
  return {
    totalVotes,
    leftPercent,
    rightPercent,
    margin,
    isClose: totalVotes >= minimumVotes && margin <= GAMIFICATION_CONFIG.brawls.closeMarginPercent,
    leadChanges,
  };
}

export function calculateMomentum(
  recentVotes: Array<{ productId: string; createdAt: string }>,
  productAId: string,
  productBId: string,
  now = new Date(),
  windowMinutes = GAMIFICATION_CONFIG.brawls.momentumWindowMinutes,
): MomentumSnapshot {
  const cutoff = now.getTime() - windowMinutes * 60_000;
  const recent = recentVotes.filter((vote) => new Date(vote.createdAt).getTime() >= cutoff);
  const leftVotes = recent.filter((vote) => vote.productId === productAId).length;
  const rightVotes = recent.filter((vote) => vote.productId === productBId).length;
  const total = Math.max(1, leftVotes + rightVotes);
  const leftPercent = Math.round((leftVotes / total) * 100);
  const rightPercent = 100 - leftPercent;
  const label = leftVotes === rightVotes ? "Momentum is even" : leftVotes > rightVotes ? "Product A is surging" : "Product B is surging";
  return { leftVotes, rightVotes, leftPercent, rightPercent, label, windowMinutes };
}

export function isPredictionLocked({ startsAt, endsAt, now = new Date() }: { startsAt: string; endsAt: string; now?: Date }): boolean {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (end <= start) return true;
  return now.getTime() >= start + (end - start) * GAMIFICATION_CONFIG.brawls.predictionLockPercent;
}

export function calculateHotBrawlScore({
  totalVotes,
  recentVotes,
  marginPercent,
  leadChanges,
  upsetPotential,
}: {
  totalVotes: number;
  recentVotes: number;
  marginPercent: number;
  leadChanges: number;
  upsetPotential: number;
}): number {
  const closeness = Math.max(0, 100 - marginPercent * 12);
  return Math.round(totalVotes * 0.04 + recentVotes * 3 + closeness + leadChanges * 5 + upsetPotential * 0.4);
}

export function getLeagueDivision(rating: number): LeagueDivision {
  return [...GAMIFICATION_CONFIG.leagueDivisions].reverse().find((division) => rating >= division.minimumRating)?.name ?? "BRONZE";
}

export function calculateLeagueMovement({ rank, totalProducts, division }: { rank: number; totalProducts: number; division: LeagueDivision }): "PROMOTED" | "RELEGATED" | "HELD" {
  if (totalProducts < 6) return "HELD";
  if (rank <= Math.min(3, Math.ceil(totalProducts * 0.2)) && division !== "DIAMOND") return "PROMOTED";
  if (rank > Math.max(totalProducts - 3, Math.floor(totalProducts * 0.8)) && division !== "BRONZE") return "RELEGATED";
  return "HELD";
}

export function canBecomeBoss(stats: Pick<ProductCompetitiveStats, "rating" | "totalBrawls" | "provisionalBrawls">): boolean {
  return stats.rating >= GAMIFICATION_CONFIG.boss.minimumRating && stats.totalBrawls >= GAMIFICATION_CONFIG.boss.minimumBrawls && stats.provisionalBrawls >= GAMIFICATION_CONFIG.boss.minimumRecentBrawls;
}

export function calculateProductPower(stats: ProductCompetitiveStats, organicSignals: { votes: number; favorites: number; recentVotes: number; trendingMovement: number; earlyDiscovery: number }) {
  const community = Math.min(100, Math.round(Math.log10(Math.max(1, organicSignals.votes + organicSignals.favorites * 2)) * 28));
  const momentum = Math.min(100, Math.round(organicSignals.recentVotes * 4 + Math.max(0, organicSignals.trendingMovement) * 5));
  const discovery = Math.min(100, Math.round(organicSignals.earlyDiscovery));
  const season = Math.min(100, Math.round((stats.seasonPoints / 120) * 100));
  return { rating: stats.rating, community, momentum, discovery, season, overall: Math.round((community + momentum + discovery + season) / 4) };
}

export function createBrawlReport({ brawl, ratingDeltaA = 0, ratingDeltaB = 0 }: { brawl: Brawl; ratingDeltaA?: number; ratingDeltaB?: number }): BrawlReport {
  const metrics = calculateBrawlMetrics({ leftVotes: brawl.leftVotes, rightVotes: brawl.rightVotes, leadChanges: brawl.leadChanges });
  const aWins = brawl.winnerProductId === (brawl.productAId ?? brawl.leftProductId);
  const draw = Boolean(brawl.draw);
  const winner = draw ? undefined : brawl.winnerProductId;
  const highlight = draw ? "A dead heat" : brawl.wasUpset ? "Upset victory" : metrics.isClose ? "Photo finish" : aWins ? "Product A controlled the finish" : "Product B controlled the finish";
  return {
    brawlId: brawl.id,
    winnerProductId: winner,
    loserProductId: draw ? undefined : brawl.loserProductId,
    draw,
    totalVotes: metrics.totalVotes,
    productAPercent: metrics.leftPercent,
    productBPercent: metrics.rightPercent,
    finalMarginPercent: metrics.margin,
    leadChanges: brawl.leadChanges ?? 0,
    largestLeadProductId: brawl.largestLeadProductId,
    largestLeadPercent: brawl.largestLeadPercent ?? 0,
    ratingDeltaA,
    ratingDeltaB,
    highlight,
    generatedAt: new Date().toISOString(),
  };
}

export const defaultDailyQuestTemplates: DailyQuestTemplate[] = [
  { id: "vote-brawls", type: "VOTE_BRAWLS", title: "Vote in 3 Brawls", description: "Make three considered community votes.", target: 3, xpReward: GAMIFICATION_CONFIG.xp.dailyQuest, active: true, version: 1 },
  { id: "discover-products", type: "DISCOVER_PRODUCTS", title: "Discover 5 products", description: "Open five product profiles and find a new idea.", target: 5, xpReward: GAMIFICATION_CONFIG.xp.dailyQuest, active: true, version: 1 },
  { id: "predict-brawls", type: "PREDICT_BRAWLS", title: "Make 2 predictions", description: "Call the result before the crowd knows.", target: 2, xpReward: GAMIFICATION_CONFIG.xp.dailyQuest, active: true, version: 1 },
  { id: "visit-categories", type: "VISIT_CATEGORIES", title: "Visit 3 categories", description: "Explore three different corners of the directory.", target: 3, xpReward: GAMIFICATION_CONFIG.xp.dailyQuest, active: true, version: 1 },
  { id: "daily-picks", type: "DAILY_PICKS", title: "Complete Today's Picks", description: "Choose three products for today's organic scorecard.", target: 1, xpReward: GAMIFICATION_CONFIG.xp.dailyQuest, active: true, version: 1 },
];

export function getDailyQuestInstances(date = new Date(), configuredTemplates: DailyQuestTemplate[] = defaultDailyQuestTemplates): DailyQuest[] {
  const dateKey = date.toISOString().slice(0, 10);
  const templates = configuredTemplates.filter((template) => template.active);
  if (!templates.length) return [];
  const offset = [...dateKey].reduce((sum, character) => sum + character.charCodeAt(0), 0) % templates.length;
  return [0, 1, 2].map((step) => {
    const template = templates[(offset + step) % templates.length];
    return { type: template.type, title: template.title, description: template.description, target: template.target, xpReward: template.xpReward, id: `${dateKey}_${template.id}`, date: dateKey };
  });
}

export function calculatePredictionStats(predictions: Array<{ correct?: boolean; voided?: boolean }>): Pick<UserGamification, "totalPredictions" | "correctPredictions" | "predictionAccuracy" | "currentPredictionStreak" | "bestPredictionStreak"> {
  let current = 0;
  let best = 0;
  let correct = 0;
  let counted = 0;
  for (const prediction of predictions) {
    if (prediction.voided) continue;
    counted += 1;
    if (prediction.correct) {
      correct += 1;
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return { totalPredictions: counted, correctPredictions: correct, predictionAccuracy: counted === 0 ? 0 : Math.round((correct / counted) * 10_000) / 100, currentPredictionStreak: current, bestPredictionStreak: best };
}

export function calculateTastemakerScore({
  votesAtSupport,
  currentOrganicVotes,
  currentTrendingRank,
  brawlWinsAfterSupport,
  daysSinceSupport,
  dailyEarlySupports,
}: {
  votesAtSupport: number;
  currentOrganicVotes: number;
  currentTrendingRank?: number;
  brawlWinsAfterSupport: number;
  daysSinceSupport: number;
  dailyEarlySupports: number;
}): number {
  const growth = Math.max(0, Math.log10(Math.max(1, currentOrganicVotes) / Math.max(1, votesAtSupport)) * 120);
  const trendBonus = currentTrendingRank ? Math.max(0, 24 - currentTrendingRank * 2) : 0;
  const competitiveBonus = Math.min(30, brawlWinsAfterSupport * 5);
  const timeDecay = Math.max(0.2, 1 - Math.max(0, daysSinceSupport) / 90);
  const diminishingReturns = 1 / Math.max(1, 1 + Math.max(0, dailyEarlySupports - 3) * 0.25);
  return Math.round((growth + trendBonus + competitiveBonus) * timeDecay * diminishingReturns);
}

export function calculateDailyPickScore(results: Array<{ points: number }>): number {
  return results.reduce((sum, result) => sum + result.points, 0);
}

export function getRivalryKey(productAId: string, productBId: string): string {
  return [productAId, productBId].sort().join("__");
}

export function summarizeRivalry(brawls: Brawl[], productAId: string, productBId: string): RivalrySummary {
  const key = getRivalryKey(productAId, productBId);
  const meetings = brawls.filter((brawl) => {
    const ids = [brawl.productAId ?? brawl.leftProductId, brawl.productBId ?? brawl.rightProductId];
    return ids.includes(productAId) && ids.includes(productBId);
  });
  const productAWins = meetings.filter((brawl) => brawl.winnerProductId === productAId).length;
  const productBWins = meetings.filter((brawl) => brawl.winnerProductId === productBId).length;
  const draws = meetings.filter((brawl) => brawl.draw).length;
  const closest = [...meetings].sort((a, b) => (a.finalMarginPercent ?? 100) - (b.finalMarginPercent ?? 100))[0];
  const biggest = [...meetings].sort((a, b) => (b.finalMarginPercent ?? 0) - (a.finalMarginPercent ?? 0))[0];
  return {
    key,
    productAId,
    productBId,
    meetings: meetings.length,
    productAWins,
    productBWins,
    draws,
    leaderProductId: productAWins === productBWins ? undefined : productAWins > productBWins ? productAId : productBId,
    latestBrawlId: meetings.at(-1)?.id,
    biggestWinBrawlId: biggest?.id,
    closestBrawlId: closest?.id,
  };
}

const productAchievementDefinitions: AchievementDefinition[] = [
  { id: "product-first-blood", name: "First Blood", description: "Win your first Brawl.", rarity: "COMMON", scope: "PRODUCT" },
  { id: "product-on-the-board", name: "On The Board", description: "Complete your first Brawl.", rarity: "COMMON", scope: "PRODUCT" },
  { id: "product-hat-trick", name: "Hat Trick", description: "Win three Brawls.", rarity: "UNCOMMON", scope: "PRODUCT" },
  { id: "product-hot-streak", name: "Hot Streak", description: "Win five consecutive Brawls.", rarity: "RARE", scope: "PRODUCT" },
  { id: "product-untouchable", name: "Untouchable", description: "Win ten consecutive Brawls.", rarity: "EPIC", scope: "PRODUCT" },
  { id: "product-giant-killer", name: "Giant Killer", description: "Beat a significantly higher-rated product.", rarity: "RARE", scope: "PRODUCT" },
  { id: "product-photo-finish", name: "Photo Finish", description: "Win by an extremely small margin.", rarity: "RARE", scope: "PRODUCT" },
  { id: "product-dominant", name: "Dominant", description: "Win with a large vote margin.", rarity: "UNCOMMON", scope: "PRODUCT" },
  { id: "product-boss", name: "Boss", description: "Earn category Boss status.", rarity: "EPIC", scope: "PRODUCT" },
  { id: "product-boss-slayer", name: "Boss Slayer", description: "Defeat a Boss product.", rarity: "LEGENDARY", scope: "PRODUCT" },
  { id: "product-season-champion", name: "Season Champion", description: "Finish first overall in a season.", rarity: "LEGENDARY", scope: "PRODUCT" },
  { id: "product-category-champion", name: "Category Champion", description: "Finish first in a category season.", rarity: "EPIC", scope: "PRODUCT" },
];

const userAchievementDefinitions: AchievementDefinition[] = [
  { id: "user-first-vote", name: "First Vote", description: "Cast your first Brawl vote.", rarity: "COMMON", scope: "USER" },
  { id: "user-brawl-regular", name: "Brawl Regular", description: "Participate in ten Brawls.", rarity: "UNCOMMON", scope: "USER" },
  { id: "user-prediction-5", name: "Sharp Eye", description: "Reach a five-prediction streak.", rarity: "RARE", scope: "USER" },
  { id: "user-prediction-10", name: "Oracle", description: "Reach a ten-prediction streak.", rarity: "EPIC", scope: "USER" },
  { id: "user-early-adopter", name: "Early Adopter", description: "Find ten products before they trend.", rarity: "RARE", scope: "USER" },
  { id: "user-tastemaker", name: "Tastemaker", description: "Reach 1,000 Tastemaker Score.", rarity: "EPIC", scope: "USER" },
  { id: "user-daily-picks", name: "Daily Picks Winner", description: "Finish first in a Daily Picks result.", rarity: "RARE", scope: "USER" },
];

export function evaluateProductAchievements(stats: ProductCompetitiveStats, context: { wonBoss?: boolean; photoFinish?: boolean; dominant?: boolean; seasonChampion?: boolean; categoryChampion?: boolean }): AchievementDefinition[] {
  const earned: AchievementDefinition[] = [];
  const add = (id: string, condition: boolean) => { const definition = productAchievementDefinitions.find((item) => item.id === id); if (definition && condition) earned.push(definition); };
  add("product-on-the-board", stats.totalBrawls >= 1);
  add("product-first-blood", stats.wins >= 1);
  add("product-hat-trick", stats.wins >= 3);
  add("product-hot-streak", stats.longestWinStreak >= 5);
  add("product-untouchable", stats.longestWinStreak >= 10);
  add("product-giant-killer", stats.upsetWins >= 1);
  add("product-photo-finish", Boolean(context.photoFinish || stats.closeWins >= 1));
  add("product-dominant", Boolean(context.dominant));
  add("product-boss", stats.isBoss);
  add("product-boss-slayer", Boolean(context.wonBoss || stats.bossWins >= 1));
  add("product-season-champion", Boolean(context.seasonChampion));
  add("product-category-champion", Boolean(context.categoryChampion));
  return earned;
}

export function evaluateUserAchievements(stats: Pick<UserGamification, "totalPredictions" | "currentPredictionStreak" | "bestPredictionStreak" | "earlyFinds" | "tastemakerScore" | "dailyPickWins"> & { totalVotes?: number }): AchievementDefinition[] {
  const earned: AchievementDefinition[] = [];
  const add = (id: string, condition: boolean) => { const definition = userAchievementDefinitions.find((item) => item.id === id); if (definition && condition) earned.push(definition); };
  add("user-first-vote", (stats.totalVotes ?? 0) >= 1);
  add("user-brawl-regular", (stats.totalVotes ?? 0) >= 10);
  add("user-prediction-5", stats.bestPredictionStreak >= 5);
  add("user-prediction-10", stats.bestPredictionStreak >= 10);
  add("user-early-adopter", stats.earlyFinds >= 10);
  add("user-tastemaker", stats.tastemakerScore >= 1000);
  add("user-daily-picks", stats.dailyPickWins >= 1);
  return earned;
}

export function getAchievementDefinitions(): AchievementDefinition[] {
  return [...productAchievementDefinitions, ...userAchievementDefinitions];
}
