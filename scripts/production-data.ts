import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { getAdminDb } from "../src/lib/firebase/admin";
import { asCompetitiveStats, emptyProductStats, searchTokens } from "../src/lib/repositories/documents";
import { defaultDailyQuestTemplates, evaluateProductAchievements, evaluateUserAchievements, getAchievementDefinitions, getDailyQuestInstances, getLeagueDivision, getLevelForXp } from "../src/lib/server/gamification";

type Mutation = { collection: string; id: string; data: Record<string, unknown> };

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function withoutUndefined(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function dateValue(value: unknown) {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return (value as { toDate: () => Date }).toDate();
  return value ? new Date(String(value)) : new Date(0);
}

export function getDb() {
  const db = getAdminDb();
  if (!db) throw new Error("Firestore is not configured. Set the Firebase Admin environment variables first.");
  return db;
}

export async function collectProductionMigrationPlan(db = getDb()): Promise<Mutation[]> {
  const now = new Date();
  const mutations: Mutation[] = [];
  const [products, stats, users, brawls, productDailyStats, seasons, productMembers, seasonStats, bossReigns, userGamification, brawlVotes] = await Promise.all([
    db.collection("products").limit(10_000).get(),
    db.collection("productCompetitiveStats").limit(10_000).get(),
    db.collection("users").limit(10_000).get(),
    db.collection("brawls").limit(10_000).get(),
    db.collection("productDailyStats").limit(20_000).get(),
    db.collection("brawlSeasons").limit(100).get(),
    db.collection("productMembers").limit(20_000).get(),
    db.collection("seasonProductStats").limit(20_000).get(),
    db.collection("bossReigns").limit(2_000).get(),
    db.collection("userGamification").limit(10_000).get(),
    db.collection("brawlVotes").limit(50_000).get(),
  ]);
  const voteCounts = new Map<string, number>();
  for (const vote of brawlVotes.docs) {
    const userId = stringValue(vote.data()?.userId);
    if (userId) voteCounts.set(userId, (voteCounts.get(userId) ?? 0) + 1);
  }
  const productById = new Map(products.docs.map((document) => [document.id, document.data()]));
  const statsByProduct = new Map(stats.docs.map((document) => [document.id, document.data()]));
  const brawlById = new Map(brawls.docs.map((document) => [document.id, document.data()]));
  const memberIds = new Set(productMembers.docs.map((document) => document.id));
  const seasonStatIds = new Set(seasonStats.docs.map((document) => document.id));
  const activeReigns = new Set(bossReigns.docs.filter((document) => !document.data()?.endedAt).map((document) => document.id));

  for (const document of products.docs) {
    const data = document.data();
    const totalVotes = numberValue(data.totalVotes);
    const totalFavorites = numberValue(data.totalFavorites);
    const changes: Record<string, unknown> = {
      makerIds: Array.isArray(data.makerIds) && data.makerIds.length ? data.makerIds.map(String) : [stringValue(data.ownerId)].filter(Boolean),
      makerCount: numberValue(data.makerCount, 1),
      ownershipStatus: data.ownershipStatus === "VERIFIED" || data.ownershipStatus === "PENDING" ? data.ownershipStatus : "UNCLAIMED",
      organicVotes: numberValue(data.organicVotes, totalVotes),
      organicFavorites: numberValue(data.organicFavorites, totalFavorites),
      // Legacy paid click events are not classifiable. They stay out of future
      // organic ranking until an explicit organic event is recorded.
      organicQualifiedClicks: numberValue(data.organicQualifiedClicks),
      organicViews: numberValue(data.organicViews),
      paidQualifiedClicks: numberValue(data.paidQualifiedClicks),
      paidImpressions: numberValue(data.paidImpressions),
      searchTerms: searchTokens(`${stringValue(data.name)} ${stringValue(data.shortDescription)} ${stringValue(data.fullDescription)} ${stringValue(data.categoryId)} ${stringValue(data.makerName)} ${Array.isArray(data.tags) ? data.tags.map(String).join(" ") : ""}`),
      updatedAt: now,
      migrationVersion: 1,
    };
    if (!data.launchDate) changes.launchDate = now.toISOString().slice(0, 10);
    mutations.push({ collection: "products", id: document.id, data: changes });
    const ownerId = stringValue(data.ownerId);
    const memberId = `${document.id}_${ownerId}`;
    if (ownerId && !memberIds.has(memberId)) mutations.push({ collection: "productMembers", id: memberId, data: { id: memberId, productId: document.id, userId: ownerId, role: "OWNER", status: "ACTIVE", createdAt: now, updatedAt: now, migrationVersion: 1 } });
    const launchMetadata = data.launchMetadata && typeof data.launchMetadata === "object" ? data.launchMetadata as Record<string, unknown> : undefined;
    if (launchMetadata && Object.values(launchMetadata).some((value) => typeof value === "string" && value.trim())) mutations.push({ collection: "launchEvents", id: document.id, data: { id: document.id, productId: document.id, tagline: stringValue(launchMetadata.tagline) || undefined, eventType: ["LAUNCH", "DEMO", "WEBINAR", "RELEASE"].includes(stringValue(launchMetadata.eventType)) ? stringValue(launchMetadata.eventType) : undefined, eventAt: stringValue(launchMetadata.eventAt) || undefined, eventUrl: stringValue(launchMetadata.eventUrl) || undefined, status: "SCHEDULED", createdAt: now, updatedAt: now, migrationVersion: 1 } });
  }

  for (const document of stats.docs) {
    const data = document.data();
    const defaults = emptyProductStats(document.id);
    const productXp = numberValue(data.productXp, defaults.productXp);
    const level = getLevelForXp(productXp, true);
    const normalizedStats = asCompetitiveStats(document.id, data);
    mutations.push({ collection: "productCompetitiveStats", id: document.id, data: {
      productId: stringValue(data.productId, document.id),
      rating: numberValue(data.rating, defaults.rating),
      totalBrawls: numberValue(data.totalBrawls), wins: numberValue(data.wins), losses: numberValue(data.losses), draws: numberValue(data.draws),
      currentWinStreak: numberValue(data.currentWinStreak), longestWinStreak: numberValue(data.longestWinStreak), currentLossStreak: numberValue(data.currentLossStreak), longestLossStreak: numberValue(data.longestLossStreak),
      upsetWins: numberValue(data.upsetWins), closeWins: numberValue(data.closeWins), bossWins: numberValue(data.bossWins), bossDefenses: numberValue(data.bossDefenses), seasonWins: numberValue(data.seasonWins),
      productXp, productLevel: numberValue(data.productLevel, level.level), productLevelTitle: stringValue(data.productLevelTitle, level.title), division: stringValue(data.division, getLeagueDivision(numberValue(data.rating, defaults.rating))), seasonPoints: numberValue(data.seasonPoints), seasonRank: numberValue(data.seasonRank), provisionalBrawls: numberValue(data.provisionalBrawls), isBoss: Boolean(data.isBoss), updatedAt: now, migrationVersion: 1,
    } });
    for (const achievement of evaluateProductAchievements(normalizedStats, {})) mutations.push({ collection: "productAchievements", id: `${achievement.id}_${document.id}`, data: { ...achievement, id: `${achievement.id}_${document.id}`, achievementId: achievement.id, productId: document.id, subjectId: document.id, earnedAt: now, updatedAt: now, migrationVersion: 1 } });
    if (normalizedStats.isBoss) {
      const categoryId = stringValue(productById.get(document.id)?.categoryId, "general");
      const reignId = `${categoryId}_${document.id}`;
      if (!activeReigns.has(reignId)) mutations.push({ collection: "bossReigns", id: reignId, data: { id: reignId, productId: document.id, categoryId, startedAt: now, defenses: normalizedStats.bossDefenses, migrationVersion: 1 } });
    }
  }

  for (const document of products.docs) {
    if (statsByProduct.has(document.id)) continue;
    const defaults = emptyProductStats(document.id);
    mutations.push({ collection: "productCompetitiveStats", id: document.id, data: { ...defaults, updatedAt: now, migrationVersion: 1 } });
  }

  for (const document of users.docs) {
    const data = document.data();
    mutations.push({ collection: "users", id: document.id, data: {
      notificationPreferences: data.notificationPreferences && typeof data.notificationPreferences === "object" ? data.notificationPreferences : { email: true, productActivity: true, competitive: true, campaigns: true },
      emailDeliveryState: stringValue(data.emailDeliveryState, "UNKNOWN"),
      updatedAt: now,
      migrationVersion: 1,
    } });
  }

  for (const document of brawls.docs) {
    const data = document.data();
    const left = numberValue(data.productAVotes, numberValue(data.leftVotes));
    const right = numberValue(data.productBVotes, numberValue(data.rightVotes));
    mutations.push({ collection: "brawls", id: document.id, data: {
      id: document.id,
      productAId: stringValue(data.productAId, stringValue(data.leftProductId)), productBId: stringValue(data.productBId, stringValue(data.rightProductId)),
      leftVotes: left, rightVotes: right, productAVotes: left, productBVotes: right, totalVotes: left + right,
      leadChanges: numberValue(data.leadChanges), currentLeaderProductId: stringValue(data.currentLeaderProductId) || (left === right ? "" : left > right ? stringValue(data.productAId, stringValue(data.leftProductId)) : stringValue(data.productBId, stringValue(data.rightProductId))),
      bossBrawl: Boolean(data.bossBrawl), finalizationVersion: numberValue(data.finalizationVersion, data.status === "COMPLETED" ? 1 : 0), updatedAt: now, migrationVersion: 1,
    } });
  }

  for (const document of productDailyStats.docs) {
    const data = document.data();
    mutations.push({ collection: "productDailyStats", id: document.id, data: {
      organicVotes: numberValue(data.organicVotes, numberValue(data.votes)), organicFavorites: numberValue(data.organicFavorites, numberValue(data.favorites)), organicViews: numberValue(data.organicViews, numberValue(data.views)),
       // Legacy qualified clicks are not safely classifiable. Preserve only
       // explicitly organic values; future qualified traffic is recorded with
       // an explicit paid/organic field by the server event pipeline.
       organicQualifiedClicks: numberValue(data.organicQualifiedClicks),
      paidQualifiedClicks: numberValue(data.paidQualifiedClicks, numberValue(data.paidClicks)), updatedAt: now, migrationVersion: 1,
    } });
  }

  const voteWindows = new Map<string, { brawlId: string; bucketStart: Date; leftVotes: number; rightVotes: number }>();
  for (const vote of brawlVotes.docs) {
    const data = vote.data();
    const brawlId = stringValue(data.brawlId);
    const brawl = brawlById.get(brawlId);
    const createdAt = dateValue(data.createdAt);
    if (!brawlId || !brawl || Number.isNaN(createdAt.getTime())) continue;
    const bucketStart = new Date(Math.floor(createdAt.getTime() / 60_000) * 60_000);
    const bucketId = `${brawlId}_${bucketStart.toISOString().slice(0, 16).replace(/:/g, "-")}`;
    const current = voteWindows.get(bucketId) ?? { brawlId, bucketStart, leftVotes: 0, rightVotes: 0 };
    const productAId = stringValue(brawl.productAId, stringValue(brawl.leftProductId));
    if (stringValue(data.selectedProductId) === productAId) current.leftVotes += 1;
    else current.rightVotes += 1;
    voteWindows.set(bucketId, current);
  }
  for (const [id, window] of voteWindows) mutations.push({ collection: "brawlVoteWindows", id, data: { id, brawlId: window.brawlId, bucketStart: window.bucketStart, leftVotes: window.leftVotes, rightVotes: window.rightVotes, totalVotes: window.leftVotes + window.rightVotes, updatedAt: now, migrationVersion: 1 } });

  for (const definition of getAchievementDefinitions()) mutations.push({ collection: "achievementDefinitions", id: definition.id, data: { ...definition, active: true, updatedAt: now, migrationVersion: 1 } });
  for (const template of defaultDailyQuestTemplates) mutations.push({ collection: "questTemplates", id: template.id, data: { ...template, updatedAt: now, migrationVersion: 1 } });
  for (const quest of getDailyQuestInstances(now)) mutations.push({ collection: "dailyQuestInstances", id: quest.id, data: { ...quest, createdAt: now, updatedAt: now, migrationVersion: 1 } });
  const currentSeason = seasons.docs.find((document) => document.data()?.current === true || document.data()?.status === "ACTIVE");
  const currentSeasonId = currentSeason?.id ?? `season-${now.toISOString().slice(0, 7)}`;
  if (currentSeason) {
    mutations.push({ collection: "brawlSeasons", id: currentSeason.id, data: { current: true, status: "ACTIVE", updatedAt: now, migrationVersion: 1 } });
  } else {
    const endsAt = new Date(now.getTime() + 31 * 86_400_000);
    mutations.push({ collection: "brawlSeasons", id: currentSeasonId, data: { id: currentSeasonId, name: `Season ${now.toISOString().slice(0, 7)}`, slug: currentSeasonId, startsAt: now, endsAt, status: "ACTIVE", current: true, createdAt: now, updatedAt: now, migrationVersion: 1 } });
  }
  for (const document of products.docs) {
    const id = `${currentSeasonId}_${document.id}`;
    if (!seasonStatIds.has(id)) {
      const productStats = asCompetitiveStats(document.id, statsByProduct.get(document.id) ?? {});
      mutations.push({ collection: "seasonProductStats", id, data: { id, seasonId: currentSeasonId, productId: document.id, categoryId: stringValue(document.data()?.categoryId, "general"), ratingStart: productStats.rating, ratingCurrent: productStats.rating, division: productStats.division, points: 0, wins: 0, losses: 0, draws: 0, bossWins: 0, upsetWins: 0, rank: 0, movement: 0, provisional: true, updatedAt: now, migrationVersion: 1 } });
    }
  }
  for (const document of userGamification.docs) {
    const data = document.data();
    const totalVotes = voteCounts.get(document.id) ?? 0;
    for (const achievement of evaluateUserAchievements({ totalPredictions: numberValue(data.totalPredictions), currentPredictionStreak: numberValue(data.currentPredictionStreak), bestPredictionStreak: numberValue(data.bestPredictionStreak), earlyFinds: numberValue(data.earlyFinds), tastemakerScore: numberValue(data.tastemakerScore), dailyPickWins: numberValue(data.dailyPickWins), totalVotes })) mutations.push({ collection: "userAchievements", id: `${achievement.id}_${document.id}`, data: { ...achievement, id: `${achievement.id}_${document.id}`, achievementId: achievement.id, userId: document.id, subjectId: document.id, earnedAt: now, updatedAt: now, migrationVersion: 1 } });
  }
  const normalizedRecordStats = products.docs.map((document) => asCompetitiveStats(document.id, statsByProduct.get(document.id) ?? {}));
  const maxBy = <T>(items: T[], score: (item: T) => number) => items.reduce<T | undefined>((best, item) => !best || score(item) > score(best) ? item : best, undefined);
  const mostWins = maxBy(normalizedRecordStats, (item) => item.wins);
  const longestStreak = maxBy(normalizedRecordStats, (item) => item.longestWinStreak);
  const highestRating = maxBy(normalizedRecordStats, (item) => item.rating);
  const mostBossDefenses = maxBy(normalizedRecordStats, (item) => item.bossDefenses);
  const mostBossSlays = maxBy(normalizedRecordStats, (item) => item.bossWins);
  const biggestUpset = maxBy(brawls.docs, (document) => numberValue(document.data()?.upsetScore));
  const closestBrawl = brawls.docs.filter((document) => document.data()?.status === "COMPLETED").reduce<FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData> | undefined>((best, document) => !best || numberValue(document.data()?.finalMarginPercent, 100) < numberValue(best.data()?.finalMarginPercent, 100) ? document : best, undefined);
  const mostVotedBrawl = maxBy(brawls.docs, (document) => numberValue(document.data()?.totalVotes));
  const topTastemaker = maxBy(userGamification.docs, (document) => numberValue(document.data()?.tastemakerScore));
  const bestPredictionStreak = maxBy(userGamification.docs, (document) => numberValue(document.data()?.bestPredictionStreak));
  const seasonTitles = new Map<string, number>();
  for (const season of seasons.docs) {
    const champion = stringValue(season.data()?.championProductId);
    if (champion) seasonTitles.set(champion, (seasonTitles.get(champion) ?? 0) + 1);
  }
  const mostSeasonTitles = [...seasonTitles.entries()].sort((a, b) => b[1] - a[1])[0];
  mutations.push({ collection: "platformRecords", id: "current", data: withoutUndefined({
    mostBrawlWins: mostWins && mostWins.wins > 0 ? { productId: mostWins.productId, value: mostWins.wins } : undefined,
    longestWinStreak: longestStreak && longestStreak.longestWinStreak > 0 ? { productId: longestStreak.productId, value: longestStreak.longestWinStreak } : undefined,
    highestRating: highestRating && highestRating.totalBrawls > 0 ? { productId: highestRating.productId, value: highestRating.rating } : undefined,
    mostBossDefenses: mostBossDefenses && mostBossDefenses.bossDefenses > 0 ? { productId: mostBossDefenses.productId, value: mostBossDefenses.bossDefenses } : undefined,
    mostBossSlays: mostBossSlays && mostBossSlays.bossWins > 0 ? { productId: mostBossSlays.productId, value: mostBossSlays.bossWins } : undefined,
    mostSeasonTitles: mostSeasonTitles ? { productId: mostSeasonTitles[0], value: mostSeasonTitles[1] } : undefined,
    biggestUpset: biggestUpset ? { brawlId: biggestUpset.id, value: numberValue(biggestUpset.data()?.upsetScore) } : undefined,
    closestBrawl: closestBrawl ? { brawlId: closestBrawl.id, value: numberValue(closestBrawl.data()?.finalMarginPercent) } : undefined,
    mostVotedBrawl: mostVotedBrawl ? { brawlId: mostVotedBrawl.id, value: numberValue(mostVotedBrawl.data()?.totalVotes) } : undefined,
    topTastemaker: topTastemaker ? { userId: topTastemaker.id, value: numberValue(topTastemaker.data()?.tastemakerScore) } : undefined,
    bestPredictionStreak: bestPredictionStreak ? { userId: bestPredictionStreak.id, value: numberValue(bestPredictionStreak.data()?.bestPredictionStreak) } : undefined,
    updatedAt: now,
    migrationVersion: 1,
  }) });
  mutations.push({ collection: "settings", id: "productionData", data: { schemaVersion: 1, migratedAt: now, migratedCollections: [...new Set(mutations.map((mutation) => mutation.collection))] } });
  return mutations;
}

export async function applyMutations(db: FirebaseFirestore.Firestore, mutations: Mutation[]) {
  for (let offset = 0; offset < mutations.length; offset += 400) {
    const batch = db.batch();
    for (const mutation of mutations.slice(offset, offset + 400)) batch.set(db.collection(mutation.collection).doc(mutation.id), mutation.data, { merge: true });
    await batch.commit();
  }
}

export function summarizeMutations(mutations: Mutation[]) {
  return Object.fromEntries([...new Set(mutations.map((mutation) => mutation.collection))].map((collection) => [collection, mutations.filter((mutation) => mutation.collection === collection).length]));
}

export async function verifyProductionData(db = getDb()) {
  const [products, stats, brawls, seasons, definitions, questTemplates, platformRecords, members, xpLedger] = await Promise.all([
    db.collection("products").limit(10_000).get(), db.collection("productCompetitiveStats").limit(10_000).get(), db.collection("brawls").limit(10_000).get(), db.collection("brawlSeasons").limit(100).get(), db.collection("achievementDefinitions").limit(500).get(), db.collection("questTemplates").limit(500).get(), db.collection("platformRecords").limit(10).get(), db.collection("productMembers").limit(20_000).get(), db.collection("xpLedger").limit(20_000).get(),
  ]);
  const issues: string[] = [];
  for (const document of products.docs) {
    const data = document.data();
    for (const field of ["organicVotes", "organicQualifiedClicks", "organicViews", "organicFavorites", "paidQualifiedClicks", "paidImpressions", "ownershipStatus"]) if (data[field] === undefined) issues.push(`products/${document.id} missing ${field}`);
  }
  for (const document of stats.docs) if (document.data()?.productId === undefined || document.data()?.rating === undefined || document.data()?.provisionalBrawls === undefined) issues.push(`productCompetitiveStats/${document.id} missing baseline fields`);
  for (const document of brawls.docs) if (document.data()?.productAId === undefined || document.data()?.productBId === undefined || document.data()?.finalizationVersion === undefined) issues.push(`brawls/${document.id} missing contract fields`);
  const currentSeasons = seasons.docs.filter((document) => document.data()?.current === true);
  if (currentSeasons.length > 1) issues.push(`Expected at most one current season, found ${currentSeasons.length}`);
  if (products.size > 0 && currentSeasons.length === 0) issues.push("No current season found");
  if (definitions.empty) issues.push("achievementDefinitions is empty");
  if (questTemplates.empty) issues.push("questTemplates is empty");
  const ownerMemberIds = new Set(members.docs.filter((member) => member.data()?.role === "OWNER").map((member) => member.id));
  if (products.docs.some((document) => !ownerMemberIds.has(`${document.id}_${String(document.data()?.ownerId ?? "")}`))) issues.push("One or more products do not have a deterministic owner membership record.");
  if (!platformRecords.docs.some((document) => document.id === "current")) issues.push("platformRecords/current is missing");
  return { ok: issues.length === 0, counts: { products: products.size, stats: stats.size, brawls: brawls.size, seasons: seasons.size, achievementDefinitions: definitions.size, questTemplates: questTemplates.size, productMembers: members.size, xpLedger: xpLedger.size }, issues };
}

export function touchDate(value: unknown) {
  return dateValue(value).toISOString();
}
