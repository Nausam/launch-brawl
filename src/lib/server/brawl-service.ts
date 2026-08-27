import { addHours } from "date-fns";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { emptyProductStats } from "@/lib/repositories/documents";
import { findProductById } from "@/lib/repositories/catalog";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { recordQuestProgress } from "@/lib/server/quest-progress";
import {
  calculateBrawlRatingChange,
  calculateBrawlMetrics,
  calculateSeasonPoints,
  calculateUpsetScore,
  calculateWinRate,
  calculatePredictionStats,
  canBecomeBoss,
  createBrawlReport,
  evaluateProductAchievements,
  calculateLeagueMovement,
  getLeagueDivision,
  getLevelForXp,
  getAchievementDefinitions,
  evaluateUserAchievements,
  updateWinLossStreaks,
  isPredictionLocked,
} from "@/lib/server/gamification";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";
import type { Brawl, BrawlChallenge, BrawlPrediction, BrawlReport, ProductCompetitiveStats } from "@/lib/types";

type ServiceMode = "firestore" | "unconfigured";

export type ServiceResult = {
  ok: boolean;
  mode: ServiceMode;
  message: string;
  brawl?: Brawl;
  report?: BrawlReport;
  id?: string;
};

function record(data: FirebaseFirestore.DocumentData | undefined): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function dateValue(value: unknown, fallback: Date): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") return candidate.toDate().toISOString();
  }
  return fallback.toISOString();
}

export function normalizeBrawl(id: string, raw: FirebaseFirestore.DocumentData | undefined): Brawl | undefined {
  if (!raw) return undefined;
  const data = record(raw);
  const productAId = stringValue(data.productAId, stringValue(data.leftProductId));
  const productBId = stringValue(data.productBId, stringValue(data.rightProductId));
  if (!productAId || !productBId) return undefined;
  const startsAt = dateValue(data.startsAt, new Date());
  const endsAt = dateValue(data.endsAt, addHours(new Date(startsAt), 24));
  return {
    id,
    prompt: stringValue(data.question, stringValue(data.prompt, "Which product would you choose?")),
    leftProductId: productAId,
    rightProductId: productBId,
    productAId,
    productBId,
    leftVotes: numberValue(data.productAVotes, numberValue(data.leftVotes)),
    rightVotes: numberValue(data.productBVotes, numberValue(data.rightVotes)),
    totalVotes: numberValue(data.totalVotes),
    categoryId: stringValue(data.categoryId) || undefined,
    startsAt,
    endsAt,
    status: ["SCHEDULED", "UPCOMING", "LIVE", "COMPLETED", "CANCELLED"].includes(stringValue(data.status)) ? stringValue(data.status) as Brawl["status"] : "SCHEDULED",
    winnerProductId: stringValue(data.winnerProductId) || undefined,
    loserProductId: stringValue(data.loserProductId) || undefined,
    draw: booleanValue(data.draw),
    productARatingBefore: numberValue(data.productARatingBefore),
    productBRatingBefore: numberValue(data.productBRatingBefore),
    productARatingAfter: numberValue(data.productARatingAfter),
    productBRatingAfter: numberValue(data.productBRatingAfter),
    productARatingDelta: numberValue(data.productARatingDelta),
    productBRatingDelta: numberValue(data.productBRatingDelta),
    productAWinProbabilityBefore: numberValue(data.productAWinProbabilityBefore),
    productBWinProbabilityBefore: numberValue(data.productBWinProbabilityBefore),
    leadChanges: numberValue(data.leadChanges),
    largestLeadProductId: stringValue(data.largestLeadProductId) || undefined,
    largestLeadPercent: numberValue(data.largestLeadPercent),
    closestMarginPercent: numberValue(data.closestMarginPercent),
    finalMarginPercent: numberValue(data.finalMarginPercent),
    upsetScore: numberValue(data.upsetScore),
    wasUpset: booleanValue(data.wasUpset),
    wasCloseBrawl: booleanValue(data.wasCloseBrawl),
    challengerProductId: stringValue(data.challengerProductId) || undefined,
    challengedProductId: stringValue(data.challengedProductId) || undefined,
    challengeId: stringValue(data.challengeId) || undefined,
    rematchOfBrawlId: stringValue(data.rematchOfBrawlId) || undefined,
    bossBrawl: booleanValue(data.bossBrawl),
    bossProductId: stringValue(data.bossProductId) || undefined,
    seasonId: stringValue(data.seasonId) || undefined,
    createdBy: stringValue(data.createdBy) || undefined,
    finalizedAt: data.finalizedAt ? dateValue(data.finalizedAt, new Date()) : undefined,
    finalizationVersion: numberValue(data.finalizationVersion) || undefined,
    currentLeaderProductId: stringValue(data.currentLeaderProductId) || undefined,
    momentum: data.momentum && typeof data.momentum === "object" ? data.momentum as Brawl["momentum"] : undefined,
  };
}

export async function getBrawlRecord(id: string): Promise<Brawl | undefined> {
  const db = getAdminDb();
  if (!db) return undefined;
  if (id === "current") {
    const live = await db.collection("brawls").where("status", "==", "LIVE").limit(1).get();
    return live.empty ? undefined : normalizeBrawl(live.docs[0].id, live.docs[0].data());
  }
  const snapshot = await db.collection("brawls").doc(id).get();
  return snapshot.exists ? normalizeBrawl(snapshot.id, snapshot.data()) : undefined;
}

function getProductStatsFromRecord(productId: string, raw: FirebaseFirestore.DocumentData | undefined): ProductCompetitiveStats {
  const fallback = emptyProductStats(productId);
  const data = record(raw);
  const wins = numberValue(data.wins, fallback.wins);
  const losses = numberValue(data.losses, fallback.losses);
  const draws = numberValue(data.draws, fallback.draws);
  return {
    ...fallback,
    productId,
    rating: numberValue(data.rating, fallback.rating),
    totalBrawls: numberValue(data.totalBrawls, fallback.totalBrawls),
    wins,
    losses,
    draws,
    winRate: calculateWinRate(wins, losses, draws),
    currentWinStreak: numberValue(data.currentWinStreak, fallback.currentWinStreak),
    longestWinStreak: numberValue(data.longestWinStreak, fallback.longestWinStreak),
    currentLossStreak: numberValue(data.currentLossStreak, fallback.currentLossStreak),
    longestLossStreak: numberValue(data.longestLossStreak, fallback.longestLossStreak),
    upsetWins: numberValue(data.upsetWins, fallback.upsetWins),
    closeWins: numberValue(data.closeWins, fallback.closeWins),
    bossWins: numberValue(data.bossWins, fallback.bossWins),
    bossDefenses: numberValue(data.bossDefenses, fallback.bossDefenses),
    seasonWins: numberValue(data.seasonWins, fallback.seasonWins),
    productXp: numberValue(data.productXp, fallback.productXp),
    productLevel: numberValue(data.productLevel, fallback.productLevel),
    productLevelTitle: stringValue(data.productLevelTitle, fallback.productLevelTitle),
    division: ["BRONZE", "SILVER", "GOLD", "DIAMOND"].includes(stringValue(data.division)) ? stringValue(data.division) as ProductCompetitiveStats["division"] : fallback.division,
    seasonPoints: numberValue(data.seasonPoints, fallback.seasonPoints),
    seasonRank: numberValue(data.seasonRank, fallback.seasonRank),
    provisionalBrawls: numberValue(data.provisionalBrawls, fallback.provisionalBrawls),
    isBoss: booleanValue(data.isBoss, fallback.isBoss),
  };
}

function nextProductStats(current: ProductCompetitiveStats, rating: number, result: "WIN" | "LOSS" | "DRAW", upset: boolean, bossWin: boolean, bossDefense: boolean, closeWin: boolean): ProductCompetitiveStats {
  const streaks = updateWinLossStreaks(current, result === "WIN" ? "A_WIN" : result === "LOSS" ? "B_WIN" : "DRAW");
  const productXp = current.productXp + (result === "WIN" ? 20 : 8) + (upset ? 12 : 0) + (bossWin ? 16 : 0);
  const level = getLevelForXp(productXp, true);
  const next: ProductCompetitiveStats = {
    ...current,
    rating,
    totalBrawls: current.totalBrawls + 1,
    wins: current.wins + (result === "WIN" ? 1 : 0),
    losses: current.losses + (result === "LOSS" ? 1 : 0),
    draws: current.draws + (result === "DRAW" ? 1 : 0),
    currentWinStreak: streaks.currentWinStreak,
    longestWinStreak: streaks.longestWinStreak,
    currentLossStreak: streaks.currentLossStreak,
    longestLossStreak: streaks.longestLossStreak,
    upsetWins: current.upsetWins + (upset ? 1 : 0),
    closeWins: current.closeWins + (closeWin ? 1 : 0),
    bossWins: current.bossWins + (bossWin ? 1 : 0),
    bossDefenses: current.bossDefenses + (bossDefense ? 1 : 0),
    seasonWins: current.seasonWins + (result === "WIN" ? 1 : 0),
    seasonPoints: current.seasonPoints + calculateSeasonPoints({ result: result === "WIN" ? "A_WIN" : result === "LOSS" ? "B_WIN" : "DRAW", upset, bossWin, resultingWinStreak: streaks.currentWinStreak }),
    productXp,
    productLevel: level.level,
    productLevelTitle: level.title,
    provisionalBrawls: current.provisionalBrawls + 1,
  };
  return { ...next, winRate: calculateWinRate(next.wins, next.losses, next.draws), division: getLeagueDivision(rating) };
}

export async function castBrawlVote(brawlId: string, selectedProductId: string): Promise<ServiceResult & { alreadyVoted?: boolean }> {
  if (await isMaintenanceMode()) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "The platform is in maintenance mode." };
  if (!(await isFeatureEnabled("brawlsEnabled")) || !(await isFeatureEnabled("votingEnabled"))) {
    return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Brawl voting is temporarily paused." };
  }
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Sign in to vote." };
  const db = getAdminDb();
  if (!db) return { ok: false, mode: "unconfigured", message: "Voting is unavailable until Firestore is configured." };
  const brawlRef = db.collection("brawls").doc(brawlId);
  const voteRef = db.collection("brawlVotes").doc(`${brawlId}_${user.id}`);
  const xpRef = db.collection("userXpEvents").doc(`brawl_vote_${brawlId}_${user.id}`);
  const ledgerRef = db.collection("xpLedger").doc(`user_${user.id}_brawl_vote_${brawlId}`);
  const userStatsRef = db.collection("userGamification").doc(user.id);
  const result = await db.runTransaction(async (transaction) => {
    const brawlSnapshot = await transaction.get(brawlRef);
    const voteSnapshot = await transaction.get(voteRef);
    const xpSnapshot = await transaction.get(xpRef);
    const statsSnapshot = await transaction.get(userStatsRef);
    const bucketStart = new Date(Math.floor(Date.now() / 60_000) * 60_000);
    const bucketId = `${brawlId}_${bucketStart.toISOString().slice(0, 16).replace(/:/g, "-")}`;
    const bucketRef = db.collection("brawlVoteWindows").doc(bucketId);
    const bucketSnapshot = await transaction.get(bucketRef);
    const brawl = normalizeBrawl(brawlId, brawlSnapshot.data());
    if (!brawlSnapshot.exists || !brawl) return { ok: false, mode: "firestore", message: "Brawl not found." } as ServiceResult;
    if (voteSnapshot.exists) return { ok: false, mode: "firestore", message: "You have already voted in this Brawl.", alreadyVoted: true } as ServiceResult & { alreadyVoted: boolean };
    if (brawl.status !== "LIVE" || new Date(brawl.endsAt).getTime() <= Date.now()) return { ok: false, mode: "firestore", message: "Voting is closed for this Brawl." } as ServiceResult;
    const productAId = brawl.productAId ?? brawl.leftProductId;
    const productBId = brawl.productBId ?? brawl.rightProductId;
    if (selectedProductId !== productAId && selectedProductId !== productBId) return { ok: false, mode: "firestore", message: "That product is not in this Brawl." } as ServiceResult;
    const leftVotes = brawl.leftVotes + (selectedProductId === productAId ? 1 : 0);
    const rightVotes = brawl.rightVotes + (selectedProductId === productBId ? 1 : 0);
    const previousLeader = brawl.currentLeaderProductId ?? (brawl.leftVotes === brawl.rightVotes ? undefined : brawl.leftVotes > brawl.rightVotes ? productAId : productBId);
    const nextLeader = leftVotes === rightVotes ? previousLeader : leftVotes > rightVotes ? productAId : productBId;
    const leadChanges = (brawl.leadChanges ?? 0) + (previousLeader && nextLeader && previousLeader !== nextLeader ? 1 : 0);
    const metrics = calculateBrawlMetrics({ leftVotes, rightVotes, leadChanges });
    const largestLeadPercent = Math.max(brawl.largestLeadPercent ?? 0, metrics.margin);
    const largestLeadProductId = metrics.leftPercent >= metrics.rightPercent ? productAId : productBId;
    const bucketData = record(bucketSnapshot.data());
    const bucketLeftVotes = numberValue(bucketData.leftVotes) + (selectedProductId === productAId ? 1 : 0);
    const bucketRightVotes = numberValue(bucketData.rightVotes) + (selectedProductId === productBId ? 1 : 0);
    transaction.set(voteRef, { id: voteRef.id, brawlId, userId: user.id, selectedProductId, createdAt: new Date() });
    transaction.set(bucketRef, { id: bucketId, brawlId, bucketStart, leftVotes: bucketLeftVotes, rightVotes: bucketRightVotes, totalVotes: bucketLeftVotes + bucketRightVotes, updatedAt: new Date() }, { merge: true });
    transaction.update(brawlRef, { productAVotes: leftVotes, productBVotes: rightVotes, leftVotes, rightVotes, totalVotes: metrics.totalVotes, currentLeaderProductId: nextLeader, leadChanges, largestLeadProductId, largestLeadPercent, closestMarginPercent: Math.min(brawl.closestMarginPercent ?? 100, metrics.margin), wasCloseBrawl: metrics.isClose, updatedAt: new Date() });
    if (!xpSnapshot.exists) {
      transaction.set(xpRef, { id: xpRef.id, userId: user.id, type: "BRAWL_VOTE_CAST", amount: 2, sourceId: brawlId, createdAt: new Date() });
      transaction.set(ledgerRef, { id: ledgerRef.id, subjectType: "USER", subjectId: user.id, type: "BRAWL_VOTE_CAST", amount: 2, sourceId: brawlId, createdAt: new Date() }, { merge: true });
      const currentStats = record(statsSnapshot.data());
      transaction.set(userStatsRef, { userId: user.id, xp: numberValue(currentStats.xp) + 2, updatedAt: new Date() }, { merge: true });
    }
    return { ok: true, mode: "firestore", message: "Vote counted. +2 XP awarded once." } as ServiceResult;
  });
  if (result.ok) {
    await Promise.all([recordQuestProgress(user.id, "VOTE_BRAWLS"), refreshBrawlMomentum(db, brawlId)]);
  }
  return result;
}

async function refreshBrawlMomentum(db: Firestore, brawlId: string) {
  try {
    const brawlSnapshot = await db.collection("brawls").doc(brawlId).get();
    const brawl = normalizeBrawl(brawlId, brawlSnapshot.data());
    if (!brawl) return;
    const windows = await db.collection("brawlVoteWindows").where("brawlId", "==", brawlId).limit(100).get();
    const cutoff = Date.now() - 15 * 60_000;
    let leftVotes = 0;
    let rightVotes = 0;
    for (const document of windows.docs) {
      const data = record(document.data());
      if (new Date(dateValue(data.bucketStart, new Date(0))).getTime() < cutoff) continue;
      leftVotes += numberValue(data.leftVotes);
      rightVotes += numberValue(data.rightVotes);
    }
    const total = Math.max(1, leftVotes + rightVotes);
    const leftPercent = Math.round((leftVotes / total) * 100);
    const momentum = { leftVotes, rightVotes, leftPercent, rightPercent: 100 - leftPercent, label: leftVotes === rightVotes ? "Momentum is even" : leftVotes > rightVotes ? "Product A is surging" : "Product B is surging", windowMinutes: 15 };
    await db.collection("brawls").doc(brawlId).update({ momentum, updatedAt: new Date() });
  } catch {
    // Vote acceptance remains authoritative even if a secondary momentum
    // refresh cannot complete; the next vote or lifecycle pass retries it.
  }
}

export async function createBrawlPrediction(brawlId: string, predictedProductId: string): Promise<ServiceResult & { prediction?: BrawlPrediction }> {
  if (await isMaintenanceMode()) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "The platform is in maintenance mode." };
  if (!(await isFeatureEnabled("brawlsEnabled")) || !(await isFeatureEnabled("predictionsEnabled"))) {
    return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Predictions are temporarily paused." };
  }
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Sign in to predict." };
  const brawl = await getBrawlRecord(brawlId);
  if (!brawl) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Brawl not found." };
  const productAId = brawl.productAId ?? brawl.leftProductId;
  const productBId = brawl.productBId ?? brawl.rightProductId;
  if (predictedProductId !== productAId && predictedProductId !== productBId) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "That product is not in this Brawl." };
  if (brawl.status !== "LIVE" || isPredictionLocked({ startsAt: brawl.startsAt ?? new Date().toISOString(), endsAt: brawl.endsAt })) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Predictions are closed for this Brawl." };
  const id = `${brawlId}_${user.id}`;
  const db = getAdminDb();
  if (!db) return { ok: false, mode: "unconfigured", message: "Predictions are unavailable until Firestore is configured." };
  const ref = db.collection("brawlPredictions").doc(id);
  if ((await ref.get()).exists) return { ok: false, mode: "firestore", message: "You already made a prediction for this Brawl." };
  const prediction: BrawlPrediction = { id, brawlId, userId: user.id, predictedProductId, createdAt: new Date().toISOString() };
  try {
    await ref.create({ ...prediction, createdAt: new Date() });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error.code === 6 || error.code === "already-exists")) return { ok: false, mode: "firestore", message: "You already made a prediction for this Brawl." };
    throw error;
  }
  await recordQuestProgress(user.id, "PREDICT_BRAWLS");
  return { ok: true, mode: "firestore", id, message: "Prediction locked in.", prediction };
}

async function createNotification(db: Firestore, userId: string, type: string, title: string, body: string, entityId: string, href?: string) {
  if (!userId) return;
  const safeType = type.replace(/[^a-z0-9_-]/gi, "_");
  const safeEntity = entityId.replace(/[^a-z0-9_-]/gi, "_");
  const id = `${safeType}_${userId}_${safeEntity}`.slice(0, 140);
  const ref = db.collection("notifications").doc(id);
  const deliveryRef = db.collection("notificationDeliveries").doc(id);
  const userSnapshot = await db.collection("users").doc(userId).get();
  const userData = record(userSnapshot.data());
  const preferences = userData.notificationPreferences && typeof userData.notificationPreferences === "object" ? userData.notificationPreferences as Record<string, unknown> : {};
  const email = typeof userData.email === "string" ? userData.email : "";
  const emailAllowed = Boolean(email) && preferences.email !== false;
  const existing = await ref.get();
  const existingStatus = stringValue(existing.data()?.emailStatus);
  const emailStatus = existingStatus || (emailAllowed ? "PENDING" : "SKIPPED");
  const tone = /DECLINED|FAILED|REFUND/i.test(type) ? "coral" : /ACCEPTED|WIN|ACHIEVEMENT|COMPLETED/i.test(type) ? "green" : "neutral";
  await ref.set({ id, userId, type, title, body, entityId, href, tone, read: existing.exists ? Boolean(existing.data()?.read) : false, emailStatus, createdAt: existing.data()?.createdAt ?? new Date(), updatedAt: new Date() }, { merge: true });
  if (emailAllowed && emailStatus === "PENDING") {
    const delivery = await deliveryRef.get();
    if (!delivery.exists) {
      try { await deliveryRef.create({ id, notificationId: id, userId, to: email, subject: title, text: body, status: "PENDING", attempts: 0, nextAttemptAt: new Date(), createdAt: new Date(), updatedAt: new Date() }); } catch (error) {
        const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
        if (code !== "6" && code !== "already-exists") throw error;
      }
    }
  }
}

export async function createBrawlChallenge({ challengerProductId, challengedProductId, message }: { challengerProductId: string; challengedProductId: string; message?: string }): Promise<ServiceResult & { challenge?: BrawlChallenge }> {
  if (await isMaintenanceMode()) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "The platform is in maintenance mode." };
  if (!(await isFeatureEnabled("brawlsEnabled")) || !(await isFeatureEnabled("challengesEnabled"))) {
    return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Challenges are temporarily paused." };
  }
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Sign in to send a challenge." };
  const [challenger, challenged] = await Promise.all([findProductById(challengerProductId), findProductById(challengedProductId)]);
  const mode: ServiceMode = getAdminDb() ? "firestore" : "unconfigured";
  if (!challenger || !challenged) return { ok: false, mode, message: "Both products must exist." };
  if (challenger.id === challenged.id) return { ok: false, mode, message: "A product cannot challenge itself." };
  if (challenger.status !== "PUBLISHED" || challenged.status !== "PUBLISHED") return { ok: false, mode, message: "Both products must be published." };
  if (challenger.ownerId !== user.id) return { ok: false, mode, message: "Only the product owner can send a challenge." };
  const challenge: BrawlChallenge = { id: `challenge_${challenger.id}_${challenged.id}`, challengerUserId: user.id, challengerProductId, challengedProductId, challengedOwnerId: challenged.ownerId, message, status: "PENDING", createdAt: new Date().toISOString() };
  const db = getAdminDb();
  if (!db) return { ok: false, mode, message: "Challenges are unavailable until Firestore is configured." };
  const ref = db.collection("brawlChallenges").doc(challenge.id);
  const existing = await ref.get();
  if (existing.exists) {
    const existingData = record(existing.data());
    const existingStatus = stringValue(existingData.status);
    if (existingStatus === "PENDING" || existingStatus === "ACCEPTED") return { ok: false, mode, message: "A challenge between these products is already pending or accepted." };
    if (new Date(dateValue(existingData.createdAt, new Date(0))).getTime() > Date.now() - 24 * 60 * 60 * 1000) return { ok: false, mode, message: "A challenge cooldown is still active for these products." };
  }
  try {
    await ref.set({ ...challenge, createdAt: new Date(), cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "6" || code === "already-exists") return { ok: false, mode, message: "A challenge between these products is already pending." };
    throw error;
  }
  await createNotification(db, challenged.ownerId, "BRAWL_CHALLENGE_RECEIVED", `${challenger.name} challenged ${challenged.name}`, message ?? "Accept the challenge to schedule an organic Brawl.", challenge.id);
  return { ok: true, mode, id: challenge.id, message: "Challenge sent.", challenge };
}

export async function respondToBrawlChallenge(challengeId: string, action: "ACCEPT" | "DECLINE"): Promise<ServiceResult> {
  if (await isMaintenanceMode()) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "The platform is in maintenance mode." };
  if (!(await isFeatureEnabled("brawlsEnabled")) || !(await isFeatureEnabled("challengesEnabled"))) {
    return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Challenges are temporarily paused." };
  }
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Sign in to answer this challenge." };
  const db = getAdminDb();
  const mode: ServiceMode = db ? "firestore" : "unconfigured";
  if (!db) return { ok: false, mode, message: "Challenges are unavailable until Firestore is configured." };
  const challengeRef = db.collection("brawlChallenges").doc(challengeId);
  const challengeSnapshot = await challengeRef.get();
  if (!challengeSnapshot.exists) return { ok: false, mode, message: "Challenge not found." };
  const challenge = record(challengeSnapshot.data());
  if (stringValue(challenge.status) !== "PENDING") return { ok: false, mode, message: "This challenge has already been answered." };
  const challengedOwnerId = stringValue(challenge.challengedOwnerId);
  if (user.id !== challengedOwnerId && user.role !== "ADMIN" && user.role !== "MODERATOR") return { ok: false, mode, message: "Only the challenged product owner can answer this challenge." };
  const challengerProductId = stringValue(challenge.challengerProductId);
  const challengedProductId = stringValue(challenge.challengedProductId);
  const [challenger, challenged] = await Promise.all([findProductById(challengerProductId), findProductById(challengedProductId)]);
  if (!challenger || !challenged) return { ok: false, mode, message: "The challenged products are no longer available." };
  if (action === "DECLINE") {
    const declined = await db.runTransaction(async (transaction) => {
      const current = await transaction.get(challengeRef);
      if (stringValue(current.data()?.status) !== "PENDING") return false;
      transaction.update(challengeRef, { status: "DECLINED", declinedAt: new Date(), respondedAt: new Date() });
      return true;
    });
    if (!declined) return { ok: false, mode, message: "This challenge has already been answered." };
    await createNotification(db, stringValue(challenge.challengerUserId), "BRAWL_CHALLENGE_DECLINED", `${challenged.name} declined the challenge`, "You can request a rematch later when the cooldown ends.", challengeId);
    return { ok: true, mode, id: challengeId, message: "Challenge declined." };
  }
  const brawlId = `${challengeId}_brawl`;
  const brawlRef = db.collection("brawls").doc(brawlId);
  const accepted = await db.runTransaction(async (transaction) => {
    const current = await transaction.get(challengeRef);
    if (stringValue(current.data()?.status) !== "PENDING") return false;
    const startsAt = new Date();
    const endsAt = addHours(startsAt, 24);
    const seasonId = stringValue(challenge.seasonId);
    transaction.set(brawlRef, { id: brawlId, productAId: challengerProductId, productBId: challengedProductId, leftProductId: challengerProductId, rightProductId: challengedProductId, categoryId: challenger.categoryId, question: "Which product would you choose?", status: "LIVE", startsAt, endsAt, productAVotes: 0, productBVotes: 0, totalVotes: 0, challengeId, ...(seasonId ? { seasonId } : {}), createdAt: startsAt, updatedAt: startsAt });
    transaction.update(challengeRef, { status: "ACCEPTED", acceptedAt: startsAt, respondedAt: startsAt, createdBrawlId: brawlId });
    return true;
  });
  if (!accepted) return { ok: false, mode, message: "This challenge has already been answered." };
  await createNotification(db, stringValue(challenge.challengerUserId), "BRAWL_CHALLENGE_ACCEPTED", `${challenged.name} accepted your challenge`, "Your Brawl is live.", brawlId);
  return { ok: true, mode, id: brawlId, message: "Challenge accepted and Brawl created." };
}

export async function requestRematch(brawlId: string, message?: string): Promise<ServiceResult> {
  if (await isMaintenanceMode()) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "The platform is in maintenance mode." };
  if (!(await isFeatureEnabled("brawlsEnabled")) || !(await isFeatureEnabled("challengesEnabled"))) {
    return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Rematches are temporarily paused." };
  }
  const brawl = await getBrawlRecord(brawlId);
  const mode: ServiceMode = getAdminDb() ? "firestore" : "unconfigured";
  if (!brawl) return { ok: false, mode, message: "Brawl not found." };
  if (brawl.status !== "COMPLETED") return { ok: false, mode, message: "Rematches are available after a completed Brawl." };
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, mode, message: "Sign in to request a rematch." };
  const id = `${brawlId}_${user.id}`;
  const db = getAdminDb();
  if (!db) return { ok: false, mode, message: "Rematches are unavailable until Firestore is configured." };
  const ref = db.collection("brawlRematches").doc(id);
  const existing = await ref.get();
  if (existing.exists && stringValue(existing.data()?.status) === "PENDING") return { ok: false, mode, message: "A rematch request is already pending." };
  await ref.set({ id, brawlId, requesterUserId: user.id, message, status: "PENDING", createdAt: new Date(), updatedAt: new Date() });
  const otherProductId = user.id === (await findProductById(brawl.productAId ?? brawl.leftProductId))?.ownerId ? (brawl.productBId ?? brawl.rightProductId) : (brawl.productAId ?? brawl.leftProductId);
  const otherProduct = await findProductById(otherProductId);
  if (otherProduct) await createNotification(db, otherProduct.ownerId, "BRAWL_REMATCH_RECEIVED", "A rematch has been requested", message ?? "Review the request and decide whether to run it back.", id, `/dashboard/notifications`);
  return { ok: true, mode, id, message: "Rematch request sent." };
}

export async function respondToRematch(rematchId: string, action: "ACCEPT" | "DECLINE"): Promise<ServiceResult> {
  if (await isMaintenanceMode()) return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "The platform is in maintenance mode." };
  if (!(await isFeatureEnabled("brawlsEnabled")) || !(await isFeatureEnabled("challengesEnabled"))) {
    return { ok: false, mode: getAdminDb() ? "firestore" : "unconfigured", message: "Rematches are temporarily paused." };
  }
  const user = await getCurrentAppUser();
  const db = getAdminDb();
  const mode: ServiceMode = db ? "firestore" : "unconfigured";
  if (!user) return { ok: false, mode, message: "Sign in to answer this rematch." };
  if (!db) return { ok: false, mode, message: "Rematches are unavailable until Firestore is configured." };
  const requestRef = db.collection("brawlRematches").doc(rematchId);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) return { ok: false, mode, message: "Rematch request not found." };
  const request = record(requestSnapshot.data());
  if (stringValue(request.status) !== "PENDING") return { ok: false, mode, message: "This rematch request has already been answered." };
  if (new Date(dateValue(request.createdAt, new Date(0))).getTime() + 48 * 60 * 60 * 1000 <= Date.now()) {
    await requestRef.update({ status: "EXPIRED", expiredAt: new Date(), updatedAt: new Date() });
    return { ok: false, mode, message: "This rematch request has expired." };
  }
  const brawlId = stringValue(request.brawlId);
  const brawl = await getBrawlRecord(brawlId);
  if (!brawl) return { ok: false, mode, message: "The original Brawl is no longer available." };
  const [left, right] = await Promise.all([findProductById(brawl.productAId ?? brawl.leftProductId), findProductById(brawl.productBId ?? brawl.rightProductId)]);
  if (!left || !right) return { ok: false, mode, message: "The original products are no longer available." };
  const isRequester = user.id === stringValue(request.requesterUserId);
  const isParticipant = user.id === left.ownerId || user.id === right.ownerId;
  const isModerator = user.role === "ADMIN" || user.role === "MODERATOR";
  if (action === "ACCEPT" && !isParticipant && !isModerator) return { ok: false, mode, message: "Only a participating product owner can accept this rematch." };
  if (action === "DECLINE" && !isRequester && !isParticipant && !isModerator) return { ok: false, mode, message: "Only the requester or a participating product owner can decline this rematch." };
  if (action === "DECLINE") {
    const declined = await db.runTransaction(async (transaction) => {
      const current = await transaction.get(requestRef);
      if (stringValue(current.data()?.status) !== "PENDING") return false;
      transaction.update(requestRef, { status: "DECLINED", respondedAt: new Date(), respondedBy: user.id });
      return true;
    });
    if (!declined) return { ok: false, mode, message: "This rematch request has already been answered." };
    await createNotification(db, stringValue(request.requesterUserId), "BRAWL_REMATCH_DECLINED", "Rematch declined", "The other product owner declined this rematch request.", rematchId, "/brawls");
    return { ok: true, mode, id: rematchId, message: "Rematch declined." };
  }
  const newBrawlId = `rematch_${brawlId}_${rematchId}`;
  const newBrawlRef = db.collection("brawls").doc(newBrawlId);
  const accepted = await db.runTransaction(async (transaction) => {
    const current = await transaction.get(requestRef);
    if (stringValue(current.data()?.status) !== "PENDING") return false;
    const startsAt = new Date();
    const endsAt = addHours(startsAt, 24);
    transaction.set(newBrawlRef, { id: newBrawlId, productAId: left.id, productBId: right.id, leftProductId: left.id, rightProductId: right.id, categoryId: brawl.categoryId, question: brawl.prompt, status: "LIVE", startsAt, endsAt, productAVotes: 0, productBVotes: 0, totalVotes: 0, rematchOfBrawlId: brawlId, bossBrawl: brawl.bossBrawl ?? false, bossProductId: brawl.bossProductId, seasonId: brawl.seasonId ?? "current", createdAt: startsAt, updatedAt: startsAt });
    transaction.update(requestRef, { status: "ACCEPTED", respondedAt: startsAt, respondedBy: user.id, createdBrawlId: newBrawlId });
    return true;
  });
  if (!accepted) return { ok: false, mode, message: "This rematch request has already been answered." };
  await createNotification(db, stringValue(request.requesterUserId), "BRAWL_REMATCH_ACCEPTED", "Rematch accepted", "The rematch is live.", newBrawlId, `/brawl/match/${newBrawlId}`);
  return { ok: true, mode, id: newBrawlId, message: "Rematch accepted and Brawl created." };
}

export async function finalizeBrawl(brawlId: string, force = false): Promise<ServiceResult & { idempotent?: boolean }> {
  const db = getAdminDb();
  const mode: ServiceMode = db ? "firestore" : "unconfigured";
  if (!db) return { ok: false, mode, message: "Brawl finalization is unavailable until Firestore is configured." };
  const brawlRef = db.collection("brawls").doc(brawlId);
  const reportRef = db.collection("brawlReports").doc(brawlId);
  const finalized = await db.runTransaction(async (transaction) => {
    const brawlSnapshot = await transaction.get(brawlRef);
    if (!brawlSnapshot.exists) return { ok: false, mode, message: "Brawl not found." } as ServiceResult & { idempotent?: boolean };
    const brawl = normalizeBrawl(brawlId, brawlSnapshot.data());
    if (!brawl) return { ok: false, mode, message: "Brawl data is invalid." } as ServiceResult & { idempotent?: boolean };
    if (brawl.status === "COMPLETED") {
      const existingReport = await transaction.get(reportRef);
      return { ok: true, mode, idempotent: true, message: "Brawl was already finalized.", brawl, report: existingReport.exists ? existingReport.data() as BrawlReport : undefined } as ServiceResult & { idempotent: boolean };
    }
    if (!force && new Date(brawl.endsAt).getTime() > Date.now()) return { ok: false, mode, message: "Brawl has not ended yet." } as ServiceResult & { idempotent?: boolean };
    const productAId = brawl.productAId ?? brawl.leftProductId;
    const productBId = brawl.productBId ?? brawl.rightProductId;
    const statsARef = db.collection("productCompetitiveStats").doc(productAId);
    const statsBRef = db.collection("productCompetitiveStats").doc(productBId);
    const statsASnapshot = await transaction.get(statsARef);
    const statsBSnapshot = await transaction.get(statsBRef);
    const statsA = getProductStatsFromRecord(productAId, statsASnapshot.data());
    const statsB = getProductStatsFromRecord(productBId, statsBSnapshot.data());
    const currentSeasonSnapshot = brawl.seasonId ? undefined : await transaction.get(db.collection("brawlSeasons").where("current", "==", true).limit(1));
    const seasonId = brawl.seasonId ?? currentSeasonSnapshot?.docs[0]?.id ?? "current";
    const seasonARef = db.collection("seasonProductStats").doc(`${seasonId}_${productAId}`);
    const seasonBRef = db.collection("seasonProductStats").doc(`${seasonId}_${productBId}`);
    const seasonASnapshot = await transaction.get(seasonARef);
    const seasonBSnapshot = await transaction.get(seasonBRef);
    const categoryId = brawl.categoryId ?? "general";
    const currentBossId = statsA.isBoss ? productAId : statsB.isBoss ? productBId : undefined;
    const result = brawl.leftVotes === brawl.rightVotes ? "DRAW" : brawl.leftVotes > brawl.rightVotes ? "A_WIN" : "B_WIN";
    const rating = calculateBrawlRatingChange({ ratingA: statsA.rating, ratingB: statsB.rating, result });
    const winnerId = result === "A_WIN" ? productAId : result === "B_WIN" ? productBId : undefined;
    const loserId = result === "A_WIN" ? productBId : result === "B_WIN" ? productAId : undefined;
    const winnerRating = winnerId === productAId ? statsA.rating : statsB.rating;
    const loserRating = loserId === productAId ? statsA.rating : statsB.rating;
    const expectedWinnerProbability = winnerId === productAId ? rating.expectedA : rating.expectedB;
    const upset = winnerId ? calculateUpsetScore({ winnerRating, loserRating, expectedWinnerProbability }) : 0;
    const wasUpset = Boolean(winnerId && (loserRating - winnerRating >= 150) && expectedWinnerProbability < 0.35);
    const metrics = calculateBrawlMetrics({ leftVotes: brawl.leftVotes, rightVotes: brawl.rightVotes, leadChanges: brawl.leadChanges });
    const bossProductId = brawl.bossProductId ?? currentBossId;
    const bossDefeated = Boolean(brawl.bossBrawl && winnerId && bossProductId && winnerId !== bossProductId);
    const bossWinA = Boolean(bossDefeated && winnerId === productAId);
    const bossWinB = Boolean(bossDefeated && winnerId === productBId);
    const bossDefenseA = Boolean(brawl.bossBrawl && winnerId === productAId && bossProductId === productAId);
    const bossDefenseB = Boolean(brawl.bossBrawl && winnerId === productBId && bossProductId === productBId);
    const rawNextA = nextProductStats(statsA, rating.newRatingA, result === "A_WIN" ? "WIN" : result === "B_WIN" ? "LOSS" : "DRAW", wasUpset && result === "A_WIN", bossWinA, bossDefenseA, Boolean(result === "A_WIN" && metrics.isClose));
    const rawNextB = nextProductStats(statsB, rating.newRatingB, result === "B_WIN" ? "WIN" : result === "A_WIN" ? "LOSS" : "DRAW", wasUpset && result === "B_WIN", bossWinB, bossDefenseB, Boolean(result === "B_WIN" && metrics.isClose));
    const nextBossId = result === "DRAW"
      ? bossProductId ?? currentBossId
      : brawl.bossBrawl
        ? winnerId === bossProductId ? bossProductId : winnerId
        : winnerId && canBecomeBoss(winnerId === productAId ? rawNextA : rawNextB)
          ? winnerId
          : currentBossId === loserId
            ? undefined
            : currentBossId;
    const nextA = { ...rawNextA, isBoss: nextBossId === productAId };
    const nextB = { ...rawNextB, isBoss: nextBossId === productBId };
    const currentReignRef = currentBossId ? db.collection("bossReigns").doc(`${categoryId}_${currentBossId}`) : undefined;
    const nextReignRef = nextBossId ? db.collection("bossReigns").doc(`${categoryId}_${nextBossId}`) : undefined;
    const currentReignSnapshot = currentReignRef ? await transaction.get(currentReignRef) : undefined;
    const nextReignSnapshot = nextReignRef && nextReignRef.path !== currentReignRef?.path ? await transaction.get(nextReignRef) : currentReignSnapshot;
    const completedBrawl: Brawl = { ...brawl, status: "COMPLETED", winnerProductId: winnerId, loserProductId: loserId, draw: result === "DRAW", productARatingBefore: statsA.rating, productBRatingBefore: statsB.rating, productARatingAfter: rating.newRatingA, productBRatingAfter: rating.newRatingB, productARatingDelta: rating.deltaA, productBRatingDelta: rating.deltaB, productAWinProbabilityBefore: rating.expectedA, productBWinProbabilityBefore: rating.expectedB, finalMarginPercent: metrics.margin, closestMarginPercent: metrics.margin, upsetScore: upset, wasUpset, wasCloseBrawl: metrics.isClose, finalizedAt: new Date().toISOString(), finalizationVersion: 1 };
    const report = createBrawlReport({ brawl: completedBrawl, ratingDeltaA: rating.deltaA, ratingDeltaB: rating.deltaB });
    transaction.update(brawlRef, { ...completedBrawl, finalizedAt: new Date(), updatedAt: new Date() });
    transaction.set(statsARef, { ...nextA, updatedAt: new Date() }, { merge: true });
    transaction.set(statsBRef, { ...nextB, updatedAt: new Date() }, { merge: true });
    transaction.set(reportRef, { ...report, createdAt: new Date() }, { merge: true });
    transaction.set(db.collection("activityEvents").doc(`${brawlId}_finalized`), { id: `${brawlId}_finalized`, type: result === "DRAW" ? "BRAWL_DRAW" : "BRAWL_WIN", entityType: "BRAWL", entityId: brawlId, productId: winnerId, metadata: { totalVotes: metrics.totalVotes, upset: wasUpset, margin: metrics.margin, bossBrawl: Boolean(brawl.bossBrawl), bossDefeated }, visibility: "PUBLIC", createdAt: new Date() }, { merge: true });
    if (currentReignRef && currentBossId !== nextBossId) transaction.set(currentReignRef, { endedAt: new Date(), defeatedByProductId: winnerId, endingBrawlId: brawlId, updatedAt: new Date() }, { merge: true });
    if (nextReignRef && nextBossId && currentBossId !== nextBossId) {
      transaction.set(nextReignRef, { id: nextReignRef.id, productId: nextBossId, categoryId, startedAt: new Date(), defenses: 0, sourceBrawlId: brawlId, updatedAt: new Date() }, { merge: true });
    } else if (nextReignRef && nextBossId && brawl.bossBrawl && winnerId === nextBossId) {
      transaction.set(nextReignRef, { id: nextReignRef.id, productId: nextBossId, categoryId, startedAt: nextReignSnapshot?.data()?.startedAt ?? new Date(), defenses: FieldValue.increment(1), updatedAt: new Date() }, { merge: true });
    }
    const seasonPointsA = calculateSeasonPoints({ result, upset: wasUpset && result === "A_WIN", bossWin: bossWinA, resultingWinStreak: nextA.currentWinStreak });
    const seasonPointsB = calculateSeasonPoints({ result: result === "A_WIN" ? "B_WIN" : result === "B_WIN" ? "A_WIN" : "DRAW", upset: wasUpset && result === "B_WIN", bossWin: bossWinB, resultingWinStreak: nextB.currentWinStreak });
    const seasonAUpdate: Record<string, unknown> = { seasonId, productId: productAId, categoryId, ratingCurrent: nextA.rating, division: nextA.division, provisional: nextA.provisionalBrawls < 5, points: FieldValue.increment(seasonPointsA), wins: FieldValue.increment(result === "A_WIN" ? 1 : 0), losses: FieldValue.increment(result === "B_WIN" ? 1 : 0), draws: FieldValue.increment(result === "DRAW" ? 1 : 0), bossWins: FieldValue.increment(bossWinA ? 1 : 0), upsetWins: FieldValue.increment(wasUpset && result === "A_WIN" ? 1 : 0), updatedAt: new Date() };
    const seasonBUpdate: Record<string, unknown> = { seasonId, productId: productBId, categoryId, ratingCurrent: nextB.rating, division: nextB.division, provisional: nextB.provisionalBrawls < 5, points: FieldValue.increment(seasonPointsB), wins: FieldValue.increment(result === "B_WIN" ? 1 : 0), losses: FieldValue.increment(result === "A_WIN" ? 1 : 0), draws: FieldValue.increment(result === "DRAW" ? 1 : 0), bossWins: FieldValue.increment(bossWinB ? 1 : 0), upsetWins: FieldValue.increment(wasUpset && result === "B_WIN" ? 1 : 0), updatedAt: new Date() };
    if (!seasonASnapshot.exists || seasonASnapshot.data()?.ratingStart === undefined) seasonAUpdate.ratingStart = statsA.rating;
    if (!seasonBSnapshot.exists || seasonBSnapshot.data()?.ratingStart === undefined) seasonBUpdate.ratingStart = statsB.rating;
    transaction.set(seasonARef, seasonAUpdate, { merge: true });
    transaction.set(seasonBRef, seasonBUpdate, { merge: true });
    const productXpA = nextA.productXp - statsA.productXp;
    const productXpB = nextB.productXp - statsB.productXp;
    transaction.set(db.collection("productXpEvents").doc(`${brawlId}_${productAId}`), { id: `${brawlId}_${productAId}`, productId: productAId, brawlId, type: "BRAWL_OUTCOME", amount: productXpA, createdAt: new Date() }, { merge: true });
    transaction.set(db.collection("productXpEvents").doc(`${brawlId}_${productBId}`), { id: `${brawlId}_${productBId}`, productId: productBId, brawlId, type: "BRAWL_OUTCOME", amount: productXpB, createdAt: new Date() }, { merge: true });
    transaction.set(db.collection("xpLedger").doc(`product_${productAId}_brawl_${brawlId}`), { id: `product_${productAId}_brawl_${brawlId}`, subjectType: "PRODUCT", subjectId: productAId, type: "BRAWL_OUTCOME", amount: productXpA, sourceId: brawlId, createdAt: new Date() }, { merge: true });
    transaction.set(db.collection("xpLedger").doc(`product_${productBId}_brawl_${brawlId}`), { id: `product_${productBId}_brawl_${brawlId}`, subjectType: "PRODUCT", subjectId: productBId, type: "BRAWL_OUTCOME", amount: productXpB, sourceId: brawlId, createdAt: new Date() }, { merge: true });
    return { ok: true, mode, id: brawlId, message: "Brawl finalized idempotently.", report, brawl: completedBrawl } as ServiceResult & { idempotent?: boolean };
  });
  if (finalized.ok && finalized.report) {
    const completedBrawl = finalized.brawl ?? await getBrawlRecord(brawlId);
    if (completedBrawl) {
      const [productA, productB] = await Promise.all([findProductById(completedBrawl.productAId ?? completedBrawl.leftProductId), findProductById(completedBrawl.productBId ?? completedBrawl.rightProductId)]);
      await Promise.all([
        resolvePredictions(db, completedBrawl, finalized.report),
        resolveBounties(db, completedBrawl, finalized.report),
        persistProductAchievements(db, completedBrawl, completedBrawl.productAId ?? completedBrawl.leftProductId, finalized.report),
        persistProductAchievements(db, completedBrawl, completedBrawl.productBId ?? completedBrawl.rightProductId, finalized.report),
        productA && createNotification(db, productA.ownerId, "BRAWL_RESULT", finalized.report.draw ? "Your Brawl ended in a draw" : finalized.report.winnerProductId === productA.id ? "Your product won the Brawl" : "Your product lost the Brawl", finalized.report.highlight, brawlId, `/brawl/match/${brawlId}`),
        productB && createNotification(db, productB.ownerId, "BRAWL_RESULT", finalized.report.draw ? "Your Brawl ended in a draw" : finalized.report.winnerProductId === productB.id ? "Your product won the Brawl" : "Your product lost the Brawl", finalized.report.highlight, brawlId, `/brawl/match/${brawlId}`),
      ]);
    }
  }
  return finalized;
}

async function persistProductAchievements(db: Firestore, brawl: Brawl, productId: string, report: BrawlReport) {
  const statsSnapshot = await db.collection("productCompetitiveStats").doc(productId).get();
  const stats = getProductStatsFromRecord(productId, statsSnapshot.data());
  const earned = evaluateProductAchievements(stats, {
    wonBoss: Boolean(brawl.bossBrawl && report.winnerProductId === productId && (!brawl.bossProductId || report.loserProductId === brawl.bossProductId)),
    photoFinish: report.finalMarginPercent <= 3,
    dominant: report.winnerProductId === productId && report.finalMarginPercent >= 20,
  });
  if (!earned.length) return;
  const batch = db.batch();
  const now = new Date();
  for (const definition of earned) {
    const id = `${definition.id}_${productId}`;
    batch.set(db.collection("productAchievements").doc(id), { ...definition, id, achievementId: definition.id, productId, subjectId: productId, sourceBrawlId: brawl.id, earnedAt: now, updatedAt: now }, { merge: true });
  }
  await batch.commit();
}

async function persistUserAchievements(db: Firestore, userId: string) {
  const statsSnapshot = await db.collection("userGamification").doc(userId).get();
  const stats = statsSnapshot.data() ?? {};
  const totalVotes = (await db.collection("brawlVotes").where("userId", "==", userId).count().get()).data().count;
  const userStats = {
    totalPredictions: numberValue(stats.totalPredictions),
    currentPredictionStreak: numberValue(stats.currentPredictionStreak),
    bestPredictionStreak: numberValue(stats.bestPredictionStreak),
    earlyFinds: numberValue(stats.earlyFinds),
    tastemakerScore: numberValue(stats.tastemakerScore),
    dailyPickWins: numberValue(stats.dailyPickWins),
    totalVotes,
  };
  const earned = evaluateUserAchievements(userStats);
  if (!earned.length) return;
  const batch = db.batch();
  const now = new Date();
  for (const definition of earned) {
    const id = `${definition.id}_${userId}`;
    batch.set(db.collection("userAchievements").doc(id), { ...definition, id, achievementId: definition.id, userId, subjectId: userId, earnedAt: now, updatedAt: now }, { merge: true });
  }
  await batch.commit();
}

async function resolvePredictions(db: Firestore, brawl: Brawl | undefined, report: BrawlReport) {
  if (!brawl) return;
  const userIds = new Set<string>();
  let lastDocument: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  let page: FirebaseFirestore.QuerySnapshot;
  do {
    let query = db.collection("brawlPredictions").where("brawlId", "==", brawl.id).limit(100);
    if (lastDocument) query = query.startAfter(lastDocument);
    page = await query.get();
    if (page.empty && !lastDocument) return;
    const batch = db.batch();
    let writes = 0;
    for (const document of page.docs) {
      const data = record(document.data());
      const userId = stringValue(data.userId);
      if (userId) userIds.add(userId);
      if (data.resolvedAt) continue;
      const voided = report.draw;
      const correct = !voided && data.predictedProductId === report.winnerProductId;
      batch.update(document.ref, { correct, voided, resolvedAt: new Date() });
      writes += 1;
      if (correct && userId) {
        const xpRef = db.collection("userXpEvents").doc(`prediction_${brawl.id}_${userId}`);
        batch.set(xpRef, { id: xpRef.id, userId, type: "PREDICTION_RESOLVED", amount: 5, sourceId: brawl.id, createdAt: new Date() }, { merge: true });
        batch.set(db.collection("xpLedger").doc(`user_${userId}_prediction_${brawl.id}`), { id: `user_${userId}_prediction_${brawl.id}`, subjectType: "USER", subjectId: userId, type: "PREDICTION_RESOLVED", amount: 5, sourceId: brawl.id, createdAt: new Date() }, { merge: true });
        batch.set(db.collection("userGamification").doc(userId), { xp: FieldValue.increment(5), correctPredictions: FieldValue.increment(1), updatedAt: new Date() }, { merge: true });
        writes += 3;
      }
    }
    if (writes) await batch.commit();
    lastDocument = page.docs.at(-1);
  } while (page.docs.length === 100 && lastDocument);
  await Promise.all([...userIds].map(async (userId) => {
    const predictions = await db.collection("brawlPredictions").where("userId", "==", userId).limit(1_000).get();
    const ordered = predictions.docs.map((document) => {
      const data = record(document.data());
      return { correct: typeof data.correct === "boolean" ? data.correct : undefined, voided: typeof data.voided === "boolean" ? data.voided : undefined, createdAt: dateValue(data.createdAt, new Date(0)) };
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const predictionStats = calculatePredictionStats(ordered);
    const userRef = db.collection("userGamification").doc(userId);
    const current = await userRef.get();
    const xp = numberValue(current.data()?.xp);
    const level = getLevelForXp(xp);
    await userRef.set({ userId, ...predictionStats, level: level.level, levelTitle: level.title, updatedAt: new Date() }, { merge: true });
    await persistUserAchievements(db, userId);
  }));
}

async function resolveBounties(db: Firestore, brawl: Brawl | undefined, report: BrawlReport) {
  if (!brawl || !report.winnerProductId || !report.loserProductId) return;
  const snapshot = await db.collection("brawlBounties").where("status", "==", "ACTIVE").limit(100).get();
  if (snapshot.empty) return;
  const winnerId = report.winnerProductId;
  const loserId = report.loserProductId;
  const winnerBefore = numberValue(winnerId === brawl.productAId ? brawl.productARatingBefore : brawl.productBRatingBefore);
  const loserBefore = numberValue(loserId === brawl.productAId ? brawl.productARatingBefore : brawl.productBRatingBefore);
  const ratingGap = loserBefore - winnerBefore;
  const loserStatsSnapshot = await db.collection("productCompetitiveStats").doc(loserId).get();
  const loserCurrentLossStreak = numberValue(loserStatsSnapshot.data()?.currentLossStreak);

  for (const document of snapshot.docs) {
    const data = record(document.data());
    const startsAt = dateValue(data.startsAt, new Date(0));
    const endsAt = dateValue(data.endsAt, new Date(0));
    if (new Date(startsAt).getTime() > Date.now() || new Date(endsAt).getTime() <= Date.now()) continue;
    if (data.categoryId && data.categoryId !== brawl.categoryId) continue;
    if (data.targetProductId && data.targetProductId !== loserId && data.targetProductId !== winnerId) continue;
    const requirements = data.requirements && typeof data.requirements === "object" ? data.requirements as Record<string, unknown> : {};
    const type = stringValue(data.type);
    const eligible = type === "DEFEAT_BOSS"
      ? Boolean(brawl.bossBrawl && (!data.targetProductId || data.targetProductId === loserId))
      : type === "GIANT_KILLER"
        ? ratingGap >= numberValue(requirements.ratingGap, 200)
        : loserCurrentLossStreak >= numberValue(requirements.minimumStreak, 3);
    if (!eligible) continue;
    const bountyRef = document.ref;
    const statsRef = db.collection("productCompetitiveStats").doc(winnerId);
    const completed = await db.runTransaction(async (transaction) => {
      const current = await transaction.get(bountyRef);
      const statsSnapshot = await transaction.get(statsRef);
      if (!current.exists || stringValue(current.data()?.status) !== "ACTIVE") return false;
      const now = new Date();
      const xpReward = numberValue(current.data()?.xpReward);
      const nextXp = numberValue(statsSnapshot.data()?.productXp) + xpReward;
      const level = getLevelForXp(nextXp, true);
      transaction.update(bountyRef, { status: "COMPLETED", completedByProductId: winnerId, completedBrawlId: brawl.id, completedAt: now, updatedAt: now });
      transaction.set(statsRef, { productXp: nextXp, productLevel: level.level, productLevelTitle: level.title, updatedAt: now }, { merge: true });
      transaction.set(db.collection("productXpEvents").doc(`${document.id}_${brawl.id}`), { id: `${document.id}_${brawl.id}`, bountyId: document.id, brawlId: brawl.id, productId: winnerId, amount: xpReward, createdAt: now }, { merge: true });
      transaction.set(db.collection("xpLedger").doc(`product_${winnerId}_bounty_${document.id}`), { id: `product_${winnerId}_bounty_${document.id}`, subjectType: "PRODUCT", subjectId: winnerId, type: "BOUNTY_COMPLETED", amount: xpReward, sourceId: document.id, createdAt: now }, { merge: true });
      const achievementId = stringValue(current.data()?.achievementId);
      if (achievementId) transaction.set(db.collection("productAchievements").doc(`${achievementId}_${winnerId}`), { achievementId, productId: winnerId, subjectId: winnerId, sourceBountyId: document.id, sourceBrawlId: brawl.id, earnedAt: now, updatedAt: now }, { merge: true });
      transaction.set(db.collection("activityEvents").doc(`bounty_${document.id}_${brawl.id}`), { id: `bounty_${document.id}_${brawl.id}`, type: "BOUNTY_COMPLETED", entityType: "BRAWL", entityId: brawl.id, productId: winnerId, metadata: { bountyId: document.id, xpReward }, visibility: "PUBLIC", createdAt: now }, { merge: true });
      return true;
    });
    if (completed) {
      const winner = await findProductById(winnerId);
      if (winner) await createNotification(db, winner.ownerId, "BOUNTY_COMPLETED", "Bounty completed", `Your product completed the ${stringValue(data.title, "active bounty")} bounty.`, brawl.id, `/brawl/match/${brawl.id}`);
    }
  }
}

export async function runBrawlLifecycleJob(): Promise<{ mode: ServiceMode; started: number; finalized: number; errors: string[] }> {
  const db = getAdminDb();
  if (!db) return { mode: "unconfigured", started: 0, finalized: 0, errors: ["Firestore is not configured."] };
  const snapshot = await db.collection("brawls").where("status", "in", ["SCHEDULED", "UPCOMING", "LIVE"]).limit(250).get();
  let started = 0;
  let finalized = 0;
  const errors: string[] = [];
  for (const document of snapshot.docs) {
    const brawl = normalizeBrawl(document.id, document.data());
    if (!brawl) continue;
    if ((brawl.status === "SCHEDULED" || brawl.status === "UPCOMING") && new Date(brawl.startsAt ?? brawl.endsAt).getTime() <= Date.now()) {
      await document.ref.update({ status: "LIVE", updatedAt: new Date() });
      started += 1;
    }
    if (brawl.status === "LIVE" && new Date(brawl.endsAt).getTime() <= Date.now()) {
      const result = await finalizeBrawl(brawl.id);
      if (result.ok) finalized += 1; else errors.push(`${brawl.id}: ${result.message}`);
    }
  }
  return { mode: "firestore", started, finalized, errors };
}

export async function runSeasonRolloverJob(): Promise<{ mode: ServiceMode; finalized: boolean; message: string }> {
  const db = getAdminDb();
  if (!db) return { mode: "unconfigured", finalized: false, message: "Firestore is not configured." };
  const active = await db.collection("brawlSeasons").where("current", "==", true).limit(1).get();
  if (active.empty) return { mode: "firestore", finalized: false, message: "No current season found." };
  const season = active.docs[0];
  const data = record(season.data());
  if (new Date(dateValue(data.endsAt, new Date())).getTime() > Date.now()) return { mode: "firestore", finalized: false, message: "Current season has not ended." };

  const lockRef = db.collection("jobLocks").doc("season-rollover");
  const acquired = await db.runTransaction(async (transaction) => {
    const lock = await transaction.get(lockRef);
    const lockData = record(lock.data());
    const lockedAt = new Date(dateValue(lockData.lockedAt, new Date(0))).getTime();
    if (stringValue(lockData.status) === "RUNNING" && lockedAt > Date.now() - 10 * 60_000) return false;
    transaction.set(lockRef, { id: lockRef.id, job: "season-rollover", seasonId: season.id, status: "RUNNING", lockedAt: new Date(), updatedAt: new Date() }, { merge: true });
    return true;
  });
  if (!acquired) return { mode: "firestore", finalized: false, message: "Season rollover is already running." };

  try {
    const now = new Date();
    const statsSnapshot = await db.collection("seasonProductStats").where("seasonId", "==", season.id).limit(1_000).get();
    const entries = statsSnapshot.docs.map((document) => {
      const value = record(document.data());
      const productId = stringValue(value.productId);
      const division = ["BRONZE", "SILVER", "GOLD", "DIAMOND"].includes(stringValue(value.division)) ? stringValue(value.division) as ProductCompetitiveStats["division"] : "BRONZE";
      return { ref: document.ref, id: document.id, productId, categoryId: stringValue(value.categoryId, "general"), points: numberValue(value.points), wins: numberValue(value.wins), losses: numberValue(value.losses), draws: numberValue(value.draws), division, ratingCurrent: numberValue(value.ratingCurrent, 1000) };
    }).filter((entry) => entry.productId);
    const ranked = [...entries].sort((a, b) => b.points - a.points || b.wins - a.wins || b.ratingCurrent - a.ratingCurrent);
    const categoryChampions: Record<string, string> = {};
    for (const entry of [...ranked].sort((a, b) => b.points - a.points)) if (!categoryChampions[entry.categoryId]) categoryChampions[entry.categoryId] = entry.productId;
    const championProductId = ranked[0]?.productId;
    const divisionOrder: ProductCompetitiveStats["division"][] = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];
    const rolloverEntries = ranked.map((entry, index) => {
      const rank = index + 1;
      const movement = calculateLeagueMovement({ rank, totalProducts: ranked.length, division: entry.division });
      const currentDivisionIndex = divisionOrder.indexOf(entry.division);
      const nextDivisionIndex = movement === "PROMOTED" ? Math.min(divisionOrder.length - 1, currentDivisionIndex + 1) : movement === "RELEGATED" ? Math.max(0, currentDivisionIndex - 1) : currentDivisionIndex;
      return { entry, rank, movement, nextDivision: divisionOrder[nextDivisionIndex] ?? entry.division };
    });

    for (let offset = 0; offset < ranked.length; offset += 300) {
      const batch = db.batch();
      for (const current of rolloverEntries.slice(offset, offset + 300)) {
        const movementValue = current.movement === "PROMOTED" ? 1 : current.movement === "RELEGATED" ? -1 : 0;
        batch.set(current.entry.ref, { rank: current.rank, movement: movementValue, promotionRelegation: current.movement, archivedAt: now, updatedAt: now }, { merge: true });
        if (current.movement !== "HELD") batch.set(db.collection("seasonAwards").doc(`${season.id}_${current.entry.productId}_${current.movement.toLowerCase()}`), { id: `${season.id}_${current.entry.productId}_${current.movement.toLowerCase()}`, seasonId: season.id, productId: current.entry.productId, categoryId: current.entry.categoryId, award: current.movement, rank: current.rank, createdAt: now }, { merge: true });
      }
      await batch.commit();
    }

    const achievementDefinitions = new Map(getAchievementDefinitions().map((definition) => [definition.id, definition]));
    const championAwards: Array<{ collection: string; id: string; data: Record<string, unknown> }> = [];
    if (championProductId) {
      const definition = achievementDefinitions.get("product-season-champion");
      championAwards.push({ collection: "seasonAwards", id: `${season.id}_champion`, data: { id: `${season.id}_champion`, seasonId: season.id, productId: championProductId, award: "SEASON_CHAMPION", rank: 1, createdAt: now } });
      championAwards.push({ collection: "productAchievements", id: `product-season-champion_${championProductId}`, data: { ...(definition ?? {}), id: `product-season-champion_${championProductId}`, achievementId: "product-season-champion", productId: championProductId, subjectId: championProductId, seasonId: season.id, earnedAt: now, updatedAt: now } });
    }
    for (const [categoryId, productId] of Object.entries(categoryChampions)) {
      const definition = achievementDefinitions.get("product-category-champion");
      championAwards.push({ collection: "seasonAwards", id: `${season.id}_category_${categoryId}`, data: { id: `${season.id}_category_${categoryId}`, seasonId: season.id, productId, categoryId, award: "CATEGORY_CHAMPION", rank: 1, createdAt: now } });
      championAwards.push({ collection: "productAchievements", id: `product-category-champion_${productId}`, data: { ...(definition ?? {}), id: `product-category-champion_${productId}`, achievementId: "product-category-champion", productId, subjectId: productId, categoryId, seasonId: season.id, earnedAt: now, updatedAt: now } });
    }
    for (let offset = 0; offset < championAwards.length; offset += 300) {
      const batch = db.batch();
      for (const award of championAwards.slice(offset, offset + 300)) batch.set(db.collection(award.collection).doc(award.id), award.data, { merge: true });
      await batch.commit();
    }

    const nextId = `${season.id}-next`;
    const nextRef = db.collection("brawlSeasons").doc(nextId);
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(season.ref);
      const next = await transaction.get(nextRef);
      if (stringValue(current.data()?.status) === "COMPLETED" && next.exists) return;
      transaction.update(season.ref, { status: "COMPLETED", current: false, championProductId, categoryChampions, finalizedAt: now, updatedAt: now });
      if (!next.exists) transaction.create(nextRef, { id: nextId, name: `${stringValue(data.name, "Season")} + 1`, slug: nextId, startsAt: now, endsAt: addHours(now, 24 * 31), status: "ACTIVE", current: true, createdAt: now, updatedAt: now });
    });

    for (let offset = 0; offset < entries.length; offset += 300) {
      const batch = db.batch();
      for (const current of rolloverEntries.slice(offset, offset + 300)) batch.set(db.collection("productCompetitiveStats").doc(current.entry.productId), { division: current.nextDivision, seasonPoints: 0, seasonWins: 0, seasonRank: 0, provisionalBrawls: 0, updatedAt: now }, { merge: true });
      await batch.commit();
    }
    for (let offset = 0; offset < rolloverEntries.length; offset += 300) {
      const batch = db.batch();
      for (const current of rolloverEntries.slice(offset, offset + 300)) {
        const id = `${nextId}_${current.entry.productId}`;
        batch.set(db.collection("seasonProductStats").doc(id), { id, seasonId: nextId, productId: current.entry.productId, categoryId: current.entry.categoryId, ratingStart: current.entry.ratingCurrent, ratingCurrent: current.entry.ratingCurrent, points: 0, wins: 0, losses: 0, draws: 0, bossWins: 0, upsetWins: 0, rank: 0, movement: 0, division: current.nextDivision, provisional: true, updatedAt: now }, { merge: true });
      }
      await batch.commit();
    }
    await lockRef.set({ status: "COMPLETED", completedAt: now, updatedAt: now }, { merge: true });
    return { mode: "firestore" as const, finalized: true, message: `Season finalized with ${championProductId ? "a champion" : "no completed standings"}; next season opened.` };
  } catch (error) {
    await lockRef.set({ status: "FAILED", error: error instanceof Error ? error.message : "unknown", updatedAt: new Date() }, { merge: true });
    throw error;
  }
}
