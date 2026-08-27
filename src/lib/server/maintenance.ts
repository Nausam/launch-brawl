import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendTransactionalEmail } from "@/lib/integrations/email";
import { calculateDailyPickScore, getDailyQuestInstances, defaultDailyQuestTemplates } from "@/lib/server/gamification";
import type { DailyPickResult, DailyQuestTemplate } from "@/lib/types";

function asDate(value: unknown) {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return (value as { toDate: () => Date }).toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return new Date(0);
}

export async function ensureDailyQuestInstances(date = new Date()) {
  const db = getAdminDb();
  if (!db) return { written: 0, configured: false };
  const templateSnapshot = await db.collection("questTemplates").where("active", "==", true).limit(50).get();
  const templates = templateSnapshot.docs.map((document) => {
    const data = document.data();
    const type = ["VOTE_BRAWLS", "DISCOVER_PRODUCTS", "PREDICT_BRAWLS", "VISIT_CATEGORIES", "DAILY_PICKS"].includes(String(data.type)) ? String(data.type) as DailyQuestTemplate["type"] : "DISCOVER_PRODUCTS";
    return { id: document.id, type, title: String(data.title ?? "Daily quest"), description: String(data.description ?? "Take part in the community."), target: Math.max(1, Number(data.target ?? 1)), xpReward: Math.max(0, Number(data.xpReward ?? 0)), active: true, version: Math.max(1, Number(data.version ?? 1)) } satisfies DailyQuestTemplate;
  });
  const quests = getDailyQuestInstances(date, templates.length ? templates : defaultDailyQuestTemplates);
  const batch = db.batch();
  for (const quest of quests) batch.set(db.collection("dailyQuestInstances").doc(quest.id), { ...quest, templateVersion: templates.find((template) => quest.id.endsWith(`_${template.id}`))?.version ?? 1, createdAt: new Date(), updatedAt: new Date() }, { merge: true });
  await batch.commit();
  return { written: quests.length, configured: true };
}

export async function expirePendingChallenges() {
  const db = getAdminDb();
  if (!db) return { expired: 0, configured: false };
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const snapshot = await db.collection("brawlChallenges").where("status", "==", "PENDING").limit(500).get();
  const batch = db.batch();
  let expired = 0;
  for (const document of snapshot.docs) {
    if (asDate(document.data()?.createdAt).getTime() > cutoff.getTime()) continue;
    batch.update(document.ref, { status: "EXPIRED", expiredAt: new Date(), updatedAt: new Date() });
    const ownerId = String(document.data()?.challengedOwnerId ?? "");
    if (ownerId) batch.set(db.collection("notifications").doc(`challenge_expired_${document.id}`), { id: `challenge_expired_${document.id}`, userId: ownerId, type: "BRAWL_CHALLENGE_EXPIRED", title: "Brawl challenge expired", body: "The challenge was not answered within 48 hours.", entityId: document.id, read: false, createdAt: new Date() }, { merge: true });
    expired += 1;
  }
  if (expired) await batch.commit();
  return { expired, configured: true };
}

export async function maintainCampaigns() {
  const db = getAdminDb();
  if (!db) return { completed: 0, expired: 0, configured: false };
  const snapshot = await db.collection("campaigns").where("status", "in", ["ACTIVE", "PAUSED"]).limit(500).get();
  const batch = db.batch();
  let completed = 0;
  let expired = 0;
  const now = Date.now();
  for (const document of snapshot.docs) {
    const data = document.data();
    const remaining = Number(data.remainingImpressions ?? 0);
    const ended = data.expiresAt && asDate(data.expiresAt).getTime() <= now;
    if (remaining <= 0) {
      batch.update(document.ref, { status: "COMPLETED", remainingImpressions: 0, updatedAt: new Date() });
      completed += 1;
    } else if (ended) {
      batch.update(document.ref, { status: "EXPIRED", updatedAt: new Date() });
      expired += 1;
    }
  }
  if (completed || expired) await batch.commit();
  return { completed, expired, configured: true };
}

export async function expireBounties() {
  const db = getAdminDb();
  if (!db) return { expired: 0, configured: false };
  const snapshot = await db.collection("brawlBounties").where("status", "==", "ACTIVE").limit(500).get();
  const batch = db.batch();
  let expired = 0;
  const now = new Date();
  for (const document of snapshot.docs) {
    if (asDate(document.data()?.endsAt).getTime() > now.getTime()) continue;
    batch.update(document.ref, { status: "EXPIRED", expiredAt: now, updatedAt: now });
    expired += 1;
  }
  if (expired) await batch.commit();
  return { expired, configured: true };
}

async function productPickScore(db: Firestore, productId: string, date: string, competitiveBonus: Map<string, number>) {
  const snapshot = await db.collection("productDailyStats").doc(`${productId}_${date}`).get();
  const data = snapshot.data() ?? {};
  const organicVotes = Number(data.organicVotes ?? data.votes ?? 0);
  const organicFavorites = Number(data.organicFavorites ?? data.favorites ?? 0);
  return (organicVotes * 5) + (organicFavorites * 3) + (competitiveBonus.get(productId) ?? 0);
}

export async function settleDailyPicks(targetDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)) {
  const db = getAdminDb();
  if (!db) return { settled: 0, winners: 0, configured: false };
  const snapshot = await db.collection("dailyPicks").where("date", "==", targetDate).limit(1000).get();
  if (snapshot.empty) return { settled: 0, winners: 0, configured: true };
  const picks = snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as Array<{ id: string; userId?: string; date?: string; productIds?: string[] }>;
  const productIds = [...new Set(picks.flatMap((pick) => pick.productIds ?? []))];
  const competitiveBonus = new Map<string, number>();
  const brawls = await db.collection("brawls").where("status", "==", "COMPLETED").limit(2_000).get();
  for (const document of brawls.docs) {
    const data = document.data();
    const finalizedAt = asDate(data.finalizedAt ?? data.updatedAt).toISOString().slice(0, 10);
    if (finalizedAt !== targetDate) continue;
    const winner = typeof data.winnerProductId === "string" ? data.winnerProductId : "";
    const loser = typeof data.loserProductId === "string" ? data.loserProductId : "";
    if (winner) competitiveBonus.set(winner, (competitiveBonus.get(winner) ?? 0) + 20 + (data.wasUpset ? 10 : 0) + (data.wasCloseBrawl ? 5 : 0) + (data.bossBrawl ? 12 : 0));
    if (loser && data.draw) competitiveBonus.set(loser, (competitiveBonus.get(loser) ?? 0) + 4);
  }
  const scores = new Map<string, number>();
  await Promise.all(productIds.map(async (productId) => scores.set(productId, await productPickScore(db, productId, targetDate, competitiveBonus))));
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const rankByProduct = new Map(ranked.map(([productId], index) => [productId, index + 1]));
  let settled = 0;
  let winners = 0;
  for (let offset = 0; offset < picks.length; offset += 300) {
    const batch = db.batch();
    const slice = picks.slice(offset, offset + 300);
    let batchSettled = 0;
    for (const pick of slice) {
      const resultRef = db.collection("dailyPickResults").doc(`${targetDate}_${pick.userId ?? "unknown"}`);
      const existing = await resultRef.get();
      if (existing.exists) continue;
      const results: DailyPickResult[] = (pick.productIds ?? []).map((productId) => ({ productId, points: scores.get(productId) ?? 0, reason: "Organic votes and favorites recorded for the pick date." }));
      const score = calculateDailyPickScore(results);
      const rank = Math.min(...(pick.productIds ?? []).map((productId) => rankByProduct.get(productId) ?? ranked.length + 1), ranked.length + 1);
      batch.set(resultRef, { id: resultRef.id, date: targetDate, userId: pick.userId ?? "", results, score, rank, settledAt: new Date() });
      const userId = pick.userId ?? "";
      if (userId) {
        const xpRef = db.collection("userXpEvents").doc(`daily_pick_${targetDate}_${userId}`);
        const ledgerRef = db.collection("xpLedger").doc(`user_${userId}_daily_pick_${targetDate}`);
        batch.set(xpRef, { id: xpRef.id, userId, type: "DAILY_PICK_SETTLED", amount: 3, sourceId: targetDate, createdAt: new Date() }, { merge: true });
        batch.set(ledgerRef, { id: ledgerRef.id, subjectType: "USER", subjectId: userId, type: "DAILY_PICK_SETTLED", amount: 3, sourceId: targetDate, createdAt: new Date() }, { merge: true });
        batch.set(db.collection("userGamification").doc(userId), { userId, xp: FieldValue.increment(3), dailyPicksCompleted: FieldValue.increment(1), ...(rank === 1 ? { dailyPickWins: FieldValue.increment(1) } : {}), updatedAt: new Date() }, { merge: true });
      }
      settled += 1;
      batchSettled += 1;
      if (rank === 1) winners += 1;
    }
    if (batchSettled) await batch.commit();
  }
  return { settled, winners, configured: true };
}

export async function deliverPendingNotifications(limit = 50) {
  const db = getAdminDb();
  if (!db) return { attempted: 0, sent: 0, failed: 0, configured: false };
  const snapshot = await db.collection("notificationDeliveries").where("status", "==", "PENDING").limit(limit).get();
  let attempted = 0;
  let sent = 0;
  let failed = 0;
  for (const document of snapshot.docs) {
    const claimed = await db.runTransaction(async (transaction) => {
      const current = await transaction.get(document.ref);
      const data = current.data() ?? {};
      if (!current.exists || String(data.status ?? "") !== "PENDING") return false;
      const nextAttemptAt = asDate(data.nextAttemptAt).getTime();
      if (nextAttemptAt > Date.now()) return false;
      transaction.update(document.ref, { status: "PROCESSING", attempts: FieldValue.increment(1), updatedAt: new Date() });
      return true;
    });
    if (!claimed) continue;
    attempted += 1;
    const data = document.data();
    const result = await sendTransactionalEmail({ to: String(data.to ?? ""), subject: String(data.subject ?? "Launch Brawl notification"), text: String(data.text ?? "") });
    const notificationId = String(data.notificationId ?? document.id);
    if (result.sent) {
      sent += 1;
      await Promise.all([
        document.ref.update({ status: "SENT", sentAt: new Date(), updatedAt: new Date() }),
        db.collection("notifications").doc(notificationId).set({ emailStatus: "SENT", emailSentAt: new Date(), updatedAt: new Date() }, { merge: true }),
      ]);
    } else {
      failed += 1;
      const attempts = Number(data.attempts ?? 0) + 1;
      const terminal = attempts >= 5 || result.reason === "not-configured";
      await Promise.all([
        document.ref.update({ status: terminal ? "FAILED" : "PENDING", lastError: result.reason, nextAttemptAt: new Date(Date.now() + Math.min(60 * 60_000, 2 ** attempts * 60_000)), updatedAt: new Date() }),
        db.collection("notifications").doc(notificationId).set({ emailStatus: terminal ? "FAILED" : "PENDING", updatedAt: new Date() }, { merge: true }),
      ]);
    }
  }
  return { attempted, sent, failed, configured: true };
}

export async function runMaintenanceJobs() {
  const [quests, challenges, campaigns, bounties, picks, notifications] = await Promise.all([ensureDailyQuestInstances(), expirePendingChallenges(), maintainCampaigns(), expireBounties(), settleDailyPicks(), deliverPendingNotifications()]);
  return { quests, challenges, campaigns, bounties, picks, notifications };
}
