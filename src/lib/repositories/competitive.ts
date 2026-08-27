import { disableAdminDb, getAdminDb, isFirestoreUnavailableError } from "@/lib/firebase/admin";
import { normalizeBrawl } from "@/lib/server/brawl-service";
import { calculateBrawlMetrics, calculateHotBrawlScore, calculateWinRate, summarizeRivalry } from "@/lib/server/gamification";
import { getArenaSections as getDemoArenaSections, getBrawlById as getDemoBrawlById, getProductCompetitiveStats as getDemoProductCompetitiveStats, getSeasonBySlug as getDemoSeasonBySlug, getLeagueStandings as getDemoLeagueStandings, seasons as demoSeasons, demoUserGamification, demoQuestProgress, demoDailyPicks, platformRecords as demoPlatformRecords, demoChallenges, competitiveBrawls, demoBrawlReports, brawlBounties as demoBounties, activityEvents as demoActivityEvents } from "@/lib/gamification-data";
import type { ArenaSections } from "@/lib/gamification-data";
import type {
  AchievementRarity,
  Brawl,
  BrawlBounty,
  BrawlChallenge,
  BrawlReport,
  BrawlSeason,
  BossReign,
  EarnedAchievement,
  DailyQuest,
  DailyPick,
  LeagueStanding,
  PlatformRecords,
  ProductCompetitiveStats,
  QuestProgress,
  UserGamification,
} from "@/lib/types";
import {
  asActivity,
  asBounty,
  asCompetitiveStats,
  asDailyPick,
  asPlatformRecords,
  asSeason,
  asSeasonStats,
  asUser,
  asUserGamification,
  emptyProductStats,
  emptyUserGamification,
  type StoreRecord,
} from "@/lib/repositories/documents";
import { findProductById, getProductsByIds, listPublishedProducts } from "@/lib/repositories/catalog";
import { isSeedDataEnabled } from "@/lib/server/runtime";
import { getAchievementDefinitions } from "@/lib/server/gamification";
import type { Firestore } from "firebase-admin/firestore";

function rememberUnavailable(error: unknown) {
  if (isFirestoreUnavailableError(error)) disableAdminDb();
}

const achievementDefinitions = new Map(getAchievementDefinitions().map((definition) => [definition.id, definition]));
const achievementRarityCache = new Map<string, { rarity: AchievementRarity; expiresAt: number }>();
const populationCountCache = new Map<string, { count: number; expiresAt: number }>();

function earnedAchievementId(documentId: string, data: StoreRecord) {
  const explicit = typeof data.achievementId === "string" && data.achievementId ? data.achievementId : typeof data.id === "string" && data.id ? data.id : documentId;
  const separator = explicit.lastIndexOf("_");
  return separator > 0 ? explicit.slice(0, separator) : explicit;
}

function rarityFromPrevalence(count: number, population: number, fallback: AchievementRarity): AchievementRarity {
  if (count <= 0 || population <= 0) return fallback;
  const prevalence = count / population;
  if (count <= 1 || prevalence <= 0.01) return "LEGENDARY";
  if (prevalence <= 0.03) return "EPIC";
  if (prevalence <= 0.1) return "RARE";
  if (prevalence <= 0.25) return "UNCOMMON";
  return "COMMON";
}

async function activePopulationCount(db: Firestore, scope: "PRODUCT" | "USER") {
  const key = `population:${scope}`;
  const cached = populationCountCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.count;
  const collection = scope === "PRODUCT" ? "products" : "users";
  const query = scope === "PRODUCT" ? db.collection(collection).where("status", "==", "PUBLISHED") : db.collection(collection);
  const count = (await query.count().get()).data().count;
  populationCountCache.set(key, { count, expiresAt: Date.now() + 60_000 });
  return count;
}

async function dynamicAchievementRarity(db: Firestore, scope: "PRODUCT" | "USER", achievementId: string, fallback: AchievementRarity) {
  const key = `${scope}:${achievementId}`;
  const cached = achievementRarityCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.rarity;
  try {
    const collection = scope === "PRODUCT" ? "productAchievements" : "userAchievements";
    const [earnedSnapshot, population] = await Promise.all([
      db.collection(collection).where("achievementId", "==", achievementId).count().get(),
      activePopulationCount(db, scope),
    ]);
    const rarity = rarityFromPrevalence(earnedSnapshot.data().count, population, fallback);
    achievementRarityCache.set(key, { rarity, expiresAt: Date.now() + 60_000 });
    return rarity;
  } catch (error) {
    rememberUnavailable(error);
    return fallback;
  }
}

export async function listBrawlsByStatus(status: Brawl["status"], limit = 40): Promise<Brawl[]> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? competitiveBrawls.filter((brawl) => brawl.status === status).slice(0, limit) : [];
  try {
    const snapshot = await db.collection("brawls").where("status", "==", status).limit(limit).get();
    return snapshot.docs.map((doc) => normalizeBrawl(doc.id, doc.data())).filter((brawl): brawl is Brawl => Boolean(brawl));
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? competitiveBrawls.filter((brawl) => brawl.status === status).slice(0, limit) : [];
  }
}

export async function getBrawlById(id: string) {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? getDemoBrawlById(id) : undefined;
  try {
    if (id === "current") {
      const live = await listBrawlsByStatus("LIVE", 1);
      return live[0];
    }
    const snapshot = await db.collection("brawls").doc(id).get();
    return snapshot.exists ? normalizeBrawl(snapshot.id, snapshot.data()) : undefined;
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? getDemoBrawlById(id) : undefined;
  }
}

export async function getBrawlReport(brawlId: string): Promise<BrawlReport | undefined> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? demoBrawlReports.find((report) => report.brawlId === brawlId) : undefined;
  try {
    const snapshot = await db.collection("brawlReports").doc(brawlId).get();
    return snapshot.exists ? (snapshot.data() as BrawlReport) : undefined;
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? demoBrawlReports.find((report) => report.brawlId === brawlId) : undefined;
  }
}

export async function getProductCompetitiveStats(productId: string): Promise<ProductCompetitiveStats> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? getDemoProductCompetitiveStats(productId) : emptyProductStats(productId);
  try {
    const snapshot = await db.collection("productCompetitiveStats").doc(productId).get();
    return snapshot.exists ? asCompetitiveStats(productId, snapshot.data() as StoreRecord) : emptyProductStats(productId);
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? getDemoProductCompetitiveStats(productId) : emptyProductStats(productId);
  }
}

export async function getProductOrganicSignals(productId: string) {
  const db = getAdminDb();
  const product = await findProductById(productId);
  if (!db) return { votes: product?.organicVotes ?? product?.totalVotes ?? 0, favorites: product?.organicFavorites ?? product?.totalFavorites ?? 0, recentVotes: 0, trendingMovement: 0, earlyDiscovery: product?.organicQualifiedClicks ?? 0 };
  try {
    const snapshot = await db.collection("productDailyStats").where("productId", "==", productId).limit(90).get();
    const rows = snapshot.docs.map((document) => { const data = document.data(); const date = String(data.date ?? document.id.slice(-10)); return { date, votes: Number(data.organicVotes ?? data.votes ?? 0), favorites: Number(data.organicFavorites ?? data.favorites ?? 0), clicks: Number(data.organicQualifiedClicks ?? 0) }; }).sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    const recentCutoff = new Date(today.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
    const priorCutoff = new Date(today.getTime() - 14 * 86_400_000).toISOString().slice(0, 10);
    const recent = rows.filter((row) => row.date >= recentCutoff);
    const prior = rows.filter((row) => row.date >= priorCutoff && row.date < recentCutoff);
    const recentVotes = recent.reduce((sum, row) => sum + row.votes, 0);
    const priorVotes = prior.reduce((sum, row) => sum + row.votes, 0);
    return { votes: product?.organicVotes ?? rows.reduce((sum, row) => sum + row.votes, 0), favorites: product?.organicFavorites ?? rows.reduce((sum, row) => sum + row.favorites, 0), recentVotes, trendingMovement: recentVotes - priorVotes, earlyDiscovery: product?.organicQualifiedClicks ?? rows.reduce((sum, row) => sum + row.clicks, 0) };
  } catch (error) {
    rememberUnavailable(error);
    return { votes: product?.organicVotes ?? product?.totalVotes ?? 0, favorites: product?.organicFavorites ?? product?.totalFavorites ?? 0, recentVotes: 0, trendingMovement: 0, earlyDiscovery: product?.organicQualifiedClicks ?? 0 };
  }
}

export async function getArenaSections(): Promise<ArenaSections> {
  if (!getAdminDb() && isSeedDataEnabled()) return getDemoArenaSections();
  const [live, starting, recent] = await Promise.all([
    listBrawlsByStatus("LIVE", 24),
    listBrawlsByStatus("UPCOMING", 12),
    listBrawlsByStatus("COMPLETED", 12),
  ]);
  const scheduled = await listBrawlsByStatus("SCHEDULED", 12);
  const statsEntries = await Promise.all(
    [...live, ...recent].flatMap((brawl) => [brawl.productAId ?? brawl.leftProductId, brawl.productBId ?? brawl.rightProductId]).map(async (productId) => [productId, await getProductCompetitiveStats(productId)] as const),
  );
  const stats = Object.fromEntries(statsEntries);
  const score = (brawl: Brawl) => {
    const metrics = calculateBrawlMetrics({ leftVotes: brawl.leftVotes, rightVotes: brawl.rightVotes, leadChanges: brawl.leadChanges });
    const ratingA = stats[brawl.productAId ?? brawl.leftProductId]?.rating ?? 1000;
    const ratingB = stats[brawl.productBId ?? brawl.rightProductId]?.rating ?? 1000;
    return calculateHotBrawlScore({
      totalVotes: metrics.totalVotes,
      recentVotes: (brawl.momentum?.leftVotes ?? 0) + (brawl.momentum?.rightVotes ?? 0),
      marginPercent: metrics.margin,
      leadChanges: brawl.leadChanges ?? 0,
      upsetPotential: Math.max(0, Math.abs(ratingA - ratingB) - 100) / 5,
    });
  };
  const rivalries = recent.slice(0, 6).map((brawl) => summarizeRivalry(recent, brawl.productAId ?? brawl.leftProductId, brawl.productBId ?? brawl.rightProductId));
  return {
    live,
    hot: [...live].sort((a, b) => score(b) - score(a)),
    close: live.filter((brawl) => brawl.wasCloseBrawl),
    upsets: live.filter((brawl) => {
      const a = stats[brawl.productAId ?? brawl.leftProductId]?.rating ?? 1000;
      const b = stats[brawl.productBId ?? brawl.rightProductId]?.rating ?? 1000;
      const leader = brawl.leftVotes >= brawl.rightVotes ? a : b;
      const trailing = brawl.leftVotes >= brawl.rightVotes ? b : a;
      return trailing - leader >= 150;
    }),
    boss: live.filter((brawl) => brawl.bossBrawl),
    starting: [...starting, ...scheduled],
    recent: recent.slice(0, 4),
    rivalries,
  };
}

export async function listSeasons(): Promise<BrawlSeason[]> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? demoSeasons : [];
  try {
    const snapshot = await db.collection("brawlSeasons").limit(20).get();
    return snapshot.docs.map((doc) => asSeason(doc.id, doc.data() as StoreRecord)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? demoSeasons : [];
  }
}

export async function getCurrentSeason() {
  const seasons = await listSeasons();
  return seasons.find((season) => season.current || season.status === "ACTIVE") ?? seasons[0];
}

export async function getSeasonBySlug(slug: string) {
  const seasons = await listSeasons();
  return seasons.find((season) => season.slug === slug || season.id === slug) ?? (isSeedDataEnabled() ? getDemoSeasonBySlug(slug) : undefined);
}

export async function getLeagueStandings(categorySlug?: string): Promise<LeagueStanding[]> {
  const db = getAdminDb();
  const season = await getCurrentSeason();
  if (!db || !season) return isSeedDataEnabled() ? getDemoLeagueStandings(categorySlug) : [];
  try {
    const snapshot = await db.collection("seasonProductStats").where("seasonId", "==", season.id).limit(80).get();
    const entries = snapshot.docs.map((doc) => asSeasonStats(doc.id, doc.data() as StoreRecord));
    const products = await getProductsByIds(entries.map((entry) => entry.productId));
    const competitiveStats = await Promise.all(entries.map(async (entry) => [entry.productId, await getProductCompetitiveStats(entry.productId)] as const));
    const statsByProduct = new Map(competitiveStats);
    const byId = new Map(products.map((product) => [product.id, product]));
    const categories = categorySlug ? entries.filter((entry) => entry.categoryId === categorySlug || byId.get(entry.productId)?.categoryId === categorySlug) : entries;
    return categories
      .map((entry) => ({
        ...entry,
        productName: byId.get(entry.productId)?.name ?? "Unknown product",
        winRate: calculateWinRate(entry.wins, entry.losses, entry.draws),
        streak: statsByProduct.get(entry.productId)?.currentWinStreak ?? 0,
      }))
      .sort((a, b) => b.points - a.points || b.ratingCurrent - a.ratingCurrent)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? getDemoLeagueStandings(categorySlug) : [];
  }
}

export async function getUserGamification(userId: string): Promise<UserGamification> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() && userId === demoUserGamification.userId ? demoUserGamification : emptyUserGamification(userId);
  try {
    const snapshot = await db.collection("userGamification").doc(userId).get();
    return snapshot.exists ? asUserGamification(userId, snapshot.data() as StoreRecord) : emptyUserGamification(userId);
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() && userId === demoUserGamification.userId ? demoUserGamification : emptyUserGamification(userId);
  }
}

export async function listTastemakers(limit = 12) {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? [{ stats: demoUserGamification, user: undefined }] : [];
  try {
    const snapshot = await db.collection("userGamification").orderBy("tastemakerScore", "desc").limit(limit).get();
    const stats = snapshot.docs.map((doc) => asUserGamification(doc.id, doc.data() as StoreRecord)).filter((item) => item.tastemakerScore > 0);
    const users = await Promise.all(stats.map(async (item) => {
      const userSnap = await db.collection("users").doc(item.userId).get();
      return { stats: item, user: userSnap.exists ? asUser(userSnap.id, userSnap.data() as StoreRecord) : undefined };
    }));
    return users.filter((item) => item.user);
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? [{ stats: demoUserGamification, user: undefined }] : [];
  }
}

export async function getQuestProgress(userId?: string): Promise<QuestProgress[]> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? demoQuestProgress : [];
  try {
    const date = new Date().toISOString().slice(0, 10);
    const questSnapshot = await db.collection("dailyQuestInstances").where("date", "==", date).limit(12).get();
    const quests = questSnapshot.docs.map((doc) => {
      const data = doc.data() as StoreRecord;
      const type = ["VOTE_BRAWLS", "DISCOVER_PRODUCTS", "PREDICT_BRAWLS", "VISIT_CATEGORIES", "DAILY_PICKS"].includes(String(data.type)) ? String(data.type) as DailyQuest["type"] : "DISCOVER_PRODUCTS";
      return { id: doc.id, date, type, title: String(data.title ?? "Daily quest"), description: String(data.description ?? "Take part in the community."), target: Number(data.target ?? 1), xpReward: Number(data.xpReward ?? 0) } satisfies DailyQuest;
    });
    if (!userId) return quests.map((quest) => ({ ...quest, progress: 0, completed: false }));
    if (!quests.length) return [];
    const snapshot = await db.collection("userQuestProgress").where("userId", "==", userId).where("date", "==", date).limit(12).get();
    const byType = new Map(snapshot.docs.map((doc) => [String(doc.data().type ?? doc.id), doc.data() as StoreRecord]));
    return quests.map((quest) => {
      const record = byType.get(quest.type);
      const progress = typeof record?.progress === "number" ? record.progress : 0;
      return { ...quest, progress, completed: Boolean(record?.completed) || progress >= quest.target, completedAt: typeof record?.completedAt === "string" ? record.completedAt : undefined };
    });
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? demoQuestProgress : [];
  }
}

export async function getUserDailyPicks(userId: string, limit = 14): Promise<DailyPick[]> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() && userId === demoUserGamification.userId ? demoDailyPicks.slice(0, limit) : [];
  try {
    const snapshot = await db.collection("dailyPicks").where("userId", "==", userId).limit(limit).get();
    return snapshot.docs.map((doc) => asDailyPick(doc.id, doc.data() as StoreRecord)).sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() && userId === demoUserGamification.userId ? demoDailyPicks.slice(0, limit) : [];
  }
}

export async function getPlatformRecords(): Promise<PlatformRecords> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? demoPlatformRecords : {};
  try {
    const snapshot = await db.collection("platformRecords").doc("current").get();
    if (snapshot.exists) return asPlatformRecords(snapshot.data() as StoreRecord);
    const stats = await db.collection("productCompetitiveStats").limit(80).get();
    const ranked = stats.docs.map((doc) => asCompetitiveStats(doc.id, doc.data() as StoreRecord));
    const mostWins = [...ranked].sort((a, b) => b.wins - a.wins)[0];
    const streak = [...ranked].sort((a, b) => b.longestWinStreak - a.longestWinStreak)[0];
    const rating = [...ranked].sort((a, b) => b.rating - a.rating)[0];
    const defenses = [...ranked].sort((a, b) => b.bossDefenses - a.bossDefenses)[0];
    return {
      mostBrawlWins: mostWins && mostWins.wins > 0 && mostWins.productId ? { productId: mostWins.productId, value: mostWins.wins } : undefined,
      longestWinStreak: streak && streak.longestWinStreak > 0 && streak.productId ? { productId: streak.productId, value: streak.longestWinStreak } : undefined,
      highestRating: rating && rating.totalBrawls > 0 && rating.productId ? { productId: rating.productId, value: rating.rating } : undefined,
      mostBossDefenses: defenses && defenses.bossDefenses > 0 && defenses.productId ? { productId: defenses.productId, value: defenses.bossDefenses } : undefined,
    };
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? demoPlatformRecords : {};
  }
}

function demoPublicActivity(limit = 20, before?: string) {
  return demoActivityEvents
    .filter((event) => event.visibility === "PUBLIC")
    .filter((event) => !before || event.createdAt < before)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.min(100, Math.max(1, limit)));
}

export async function listPublicActivity(limit = 20, before?: string) {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? demoPublicActivity(limit, before) : [];
  try {
    let query = db.collection("activityEvents").where("visibility", "==", "PUBLIC").orderBy("createdAt", "desc").limit(Math.min(100, Math.max(1, limit)));
    if (before) query = query.startAfter(new Date(before));
    const snapshot = await query.get();
    const events = snapshot.docs.map((doc) => asActivity(doc.id, doc.data() as StoreRecord));
    return events.length || before || !isSeedDataEnabled() ? events : demoPublicActivity(limit, before);
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? demoPublicActivity(limit, before) : [];
  }
}

export async function listChallenges() {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? demoChallenges : [] as BrawlChallenge[];
  try {
    const snapshot = await db.collection("brawlChallenges").limit(40).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as BrawlChallenge);
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? demoChallenges : [];
  }
}

export async function listBounties(status?: BrawlBounty["status"], limit = 50): Promise<BrawlBounty[]> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? demoBounties.filter((bounty) => !status || bounty.status === status).slice(0, limit) : [];
  try {
    const query = status
      ? db.collection("brawlBounties").where("status", "==", status).limit(limit)
      : db.collection("brawlBounties").limit(limit);
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => asBounty(doc.id, doc.data() as StoreRecord)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? demoBounties.filter((bounty) => !status || bounty.status === status).slice(0, limit) : [];
  }
}

export async function findUserByUsername(username: string) {
  const db = getAdminDb();
  if (!db) return undefined;
  try {
    const snapshot = await db.collection("users").where("username", "==", username).limit(1).get();
    if (snapshot.empty) return undefined;
    return asUser(snapshot.docs[0].id, snapshot.docs[0].data() as StoreRecord);
  } catch (error) {
    rememberUnavailable(error);
    return undefined;
  }
}

export async function findUserById(userId: string) {
  const db = getAdminDb();
  if (!db || !userId) return undefined;
  try {
    const snapshot = await db.collection("users").doc(userId).get();
    return snapshot.exists ? asUser(snapshot.id, snapshot.data() as StoreRecord) : undefined;
  } catch (error) {
    rememberUnavailable(error);
    return undefined;
  }
}

export async function listOwnerPublishedProducts(ownerId: string) {
  const products = await listPublishedProducts();
  return products.filter((product) => product.ownerId === ownerId || product.makerIds?.includes(ownerId));
}

export async function listProductAchievements(productId: string): Promise<EarnedAchievement[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("productAchievements").where("productId", "==", productId).limit(50).get();
    const records = snapshot.docs.map((document) => {
      const data = document.data() as StoreRecord;
      const achievementId = earnedAchievementId(document.id, data);
      const definition = achievementDefinitions.get(achievementId);
      const fallback = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"].includes(String(data.rarity)) ? String(data.rarity) as AchievementRarity : definition?.rarity ?? "COMMON";
      return { document, data, achievementId, definition, fallback };
    });
    const rarities = new Map(await Promise.all(records.map(async (record) => [record.achievementId, await dynamicAchievementRarity(db, "PRODUCT", record.achievementId, record.fallback)] as const)));
    return records.map(({ document, data, achievementId, definition }) => ({ id: String(data.id ?? document.id), name: String(data.name ?? definition?.name ?? "Achievement"), description: String(data.description ?? definition?.description ?? ""), rarity: rarities.get(achievementId) ?? definition?.rarity ?? "COMMON", scope: "PRODUCT", earnedAt: String(data.earnedAt ?? ""), subjectId: productId }));
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function listProductBossReigns(productId: string, limit = 12): Promise<BossReign[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("bossReigns").where("productId", "==", productId).limit(limit).get();
    return snapshot.docs.map((document) => {
      const data = document.data();
      const iso = (value: unknown) => value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function" ? value.toDate().toISOString() : String(value ?? "");
      return { id: document.id, productId: String(data.productId ?? productId), categoryId: String(data.categoryId ?? "general"), startedAt: iso(data.startedAt), endedAt: data.endedAt ? iso(data.endedAt) : undefined, defenses: Number(data.defenses ?? 0), defeatedByProductId: typeof data.defeatedByProductId === "string" ? data.defeatedByProductId : undefined, endingBrawlId: typeof data.endingBrawlId === "string" ? data.endingBrawlId : undefined } satisfies BossReign;
    }).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function listProductRivalries(productId: string, limit = 4) {
  const completed = await listBrawlsByStatus("COMPLETED", 200);
  const opponentIds = [...new Set(completed.flatMap((brawl) => {
    const a = brawl.productAId ?? brawl.leftProductId;
    const b = brawl.productBId ?? brawl.rightProductId;
    return a === productId ? [b] : b === productId ? [a] : [];
  }))].slice(0, limit);
  return opponentIds.map((opponentId) => summarizeRivalry(completed, productId, opponentId));
}

export async function listUserActivity(userId: string, limit = 20) {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("activityEvents").where("userId", "==", userId).where("visibility", "==", "PUBLIC").limit(Math.min(100, limit * 3)).get();
    return snapshot.docs.map((document) => asActivity(document.id, document.data() as StoreRecord)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function listUserAchievements(userId: string): Promise<EarnedAchievement[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("userAchievements").where("userId", "==", userId).limit(50).get();
    const records = snapshot.docs.map((document) => {
      const data = document.data() as StoreRecord;
      const achievementId = earnedAchievementId(document.id, data);
      const definition = achievementDefinitions.get(achievementId);
      const fallback = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"].includes(String(data.rarity)) ? String(data.rarity) as AchievementRarity : definition?.rarity ?? "COMMON";
      return { document, data, achievementId, definition, fallback };
    });
    const rarities = new Map(await Promise.all(records.map(async (record) => [record.achievementId, await dynamicAchievementRarity(db, "USER", record.achievementId, record.fallback)] as const)));
    return records.map(({ document, data, achievementId, definition }) => ({ id: String(data.id ?? document.id), name: String(data.name ?? definition?.name ?? "Achievement"), description: String(data.description ?? definition?.description ?? ""), rarity: rarities.get(achievementId) ?? definition?.rarity ?? "COMMON", scope: "USER", earnedAt: String(data.earnedAt ?? ""), subjectId: userId }));
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function listRivalrySummaries(limit = 12) {
  const completed = await listBrawlsByStatus("COMPLETED", 200);
  const seen = new Set<string>();
  const summaries = [];
  for (const brawl of completed) {
    const a = brawl.productAId ?? brawl.leftProductId;
    const b = brawl.productBId ?? brawl.rightProductId;
    const key = [a, b].sort().join("_");
    if (seen.has(key)) continue;
    seen.add(key);
    summaries.push(summarizeRivalry(completed, a, b));
  }
  return summaries.slice(0, limit);
}

export async function seasonLeader() {
  const standings = await getLeagueStandings();
  const leader = standings[0];
  if (!leader) return undefined;
  const product = await findProductById(leader.productId);
  return product ? { product, standing: leader } : undefined;
}
