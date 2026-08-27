import { FieldValue } from "firebase-admin/firestore";
import { disableAdminDb, getAdminDb, isFirestoreUnavailableError } from "@/lib/firebase/admin";
import { getPlatformSettings } from "@/lib/server/settings";
import { asProduct, type StoreRecord } from "@/lib/repositories/documents";
import type { Product } from "@/lib/types";

function rememberUnavailable(error: unknown) {
  if (isFirestoreUnavailableError(error)) disableAdminDb();
}

function safeDocumentPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "unknown";
}

export async function voteForProduct(userId: string, productId: string) {
  const db = getAdminDb();
  if (!db) return { ok: false, status: 503, message: "Voting is unavailable until Firestore is configured." };
  const productRef = db.collection("products").doc(productId);
  const voteRef = db.collection("productVotes").doc(`${productId}_${userId}`);
  try {
    return await db.runTransaction(async (transaction) => {
      const [productSnap, voteSnap] = await Promise.all([transaction.get(productRef), transaction.get(voteRef)]);
      if (!productSnap.exists) return { ok: false, status: 404, message: "Product not found." };
      const product = asProduct(productSnap.id, productSnap.data() as StoreRecord);
      if (product.status !== "PUBLISHED") return { ok: false, status: 400, message: "Only published products can be voted on." };
      if (voteSnap.exists) return { ok: false, status: 409, message: "You have already voted for this product.", alreadyVoted: true, votes: product.totalVotes };
      const now = new Date();
      transaction.set(voteRef, { productId, userId, createdAt: now });
      transaction.update(productRef, { totalVotes: FieldValue.increment(1), organicVotes: FieldValue.increment(1), updatedAt: now });
      transaction.set(db.collection("productDailyStats").doc(`${productId}_${now.toISOString().slice(0, 10)}`), { productId, date: now.toISOString().slice(0, 10), votes: FieldValue.increment(1), organicVotes: FieldValue.increment(1), updatedAt: now }, { merge: true });
      transaction.set(db.collection("activityEvents").doc(`product_vote_${productId}_${userId}`), { id: `product_vote_${productId}_${userId}`, type: "PRODUCT_VOTED", entityType: "PRODUCT", entityId: productId, productId, userId, visibility: "PRIVATE", createdAt: now }, { merge: true });
      return { ok: true, status: 200, message: "Vote recorded.", votes: product.totalVotes + 1 };
    });
  } catch (error) {
    rememberUnavailable(error);
    return { ok: false, status: 500, message: "Unable to record that vote." };
  }
}

export async function toggleFavorite(userId: string, productId: string) {
  const db = getAdminDb();
  if (!db) return { ok: false, status: 503, saved: false, message: "Favorites are unavailable until Firestore is configured." };
  const favoriteRef = db.collection("favorites").doc(`${userId}_${productId}`);
  const productRef = db.collection("products").doc(productId);
  try {
    return await db.runTransaction(async (transaction) => {
      const [favoriteSnap, productSnap] = await Promise.all([transaction.get(favoriteRef), transaction.get(productRef)]);
      if (!productSnap.exists) return { ok: false, status: 404, saved: false, message: "Product not found." };
      const product = asProduct(productSnap.id, productSnap.data() as StoreRecord);
      if (product.status !== "PUBLISHED") return { ok: false, status: 400, saved: false, message: "Only published products can be saved." };
      const now = new Date();
      if (favoriteSnap.exists) {
        transaction.delete(favoriteRef);
        transaction.update(productRef, { totalFavorites: FieldValue.increment(-1), organicFavorites: FieldValue.increment(-1), updatedAt: now });
        return { ok: true, status: 200, saved: false, message: "Removed from favorites." };
      }
      transaction.set(favoriteRef, { userId, productId, createdAt: now });
      transaction.update(productRef, { totalFavorites: FieldValue.increment(1), organicFavorites: FieldValue.increment(1), updatedAt: now });
      transaction.set(db.collection("productDailyStats").doc(`${productId}_${now.toISOString().slice(0, 10)}`), { productId, date: now.toISOString().slice(0, 10), favorites: FieldValue.increment(1), organicFavorites: FieldValue.increment(1), updatedAt: now }, { merge: true });
      return { ok: true, status: 200, saved: true, message: "Saved to favorites." };
    });
  } catch (error) {
    rememberUnavailable(error);
    return { ok: false, status: 500, saved: false, message: "Unable to update favorites." };
  }
}

export async function recordQualifiedImpression(input: {
  campaignId: string;
  productId: string;
  placement: string;
  page: string;
  sessionId: string;
}) {
  const db = getAdminDb();
  if (!db) return { ok: false, qualified: false, message: "Impression tracking is unavailable." };
  const settings = await getPlatformSettings();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const impressionId = [input.campaignId, input.sessionId, input.placement].map(safeDocumentPart).join("_");
  const impressionRef = db.collection("impressions").doc(impressionId);
  const cooldownRef = db.collection("impressionCooldowns").doc([input.campaignId, input.sessionId].map(safeDocumentPart).join("_"));
  const date = new Date().toISOString().slice(0, 10);
  const dailyRef = db.collection("campaignDailyStats").doc(`${input.campaignId}_${date}`);
  try {
    return await db.runTransaction(async (transaction) => {
      const [campaignSnap, impressionSnap, cooldownSnap] = await Promise.all([transaction.get(campaignRef), transaction.get(impressionRef), transaction.get(cooldownRef)]);
      if (!campaignSnap.exists) return { ok: false, qualified: false, message: "Campaign not found." };
      const campaign = campaignSnap.data() as StoreRecord;
      if (campaign.productId !== input.productId) return { ok: false, qualified: false, message: "Campaign does not match this product." };
      if (campaign.status !== "ACTIVE") return { ok: true, qualified: false, message: "Campaign is not delivering." };
      if (impressionSnap.exists) return { ok: true, qualified: false, message: "Already counted for this session." };
      const lastQualifiedAt = cooldownSnap.data()?.qualifiedAt;
      const lastQualifiedMs = lastQualifiedAt instanceof Date ? lastQualifiedAt.getTime() : typeof lastQualifiedAt === "string" ? new Date(lastQualifiedAt).getTime() : 0;
      if (lastQualifiedMs > 0 && lastQualifiedMs + settings.impressionCooldownMs > Date.now()) return { ok: true, qualified: false, message: "Impression cooldown is active." };
      const remaining = Number(campaign.remainingImpressions ?? Number(campaign.purchasedImpressions ?? 0) - Number(campaign.qualifiedImpressions ?? 0));
      if (remaining <= 0) {
        transaction.update(campaignRef, { status: "COMPLETED", remainingImpressions: 0, updatedAt: new Date() });
        return { ok: true, qualified: false, message: "Allocation already fulfilled." };
      }
      const now = new Date();
      transaction.set(impressionRef, { ...input, createdAt: now, cooldownMs: settings.impressionCooldownMs });
      transaction.set(cooldownRef, { campaignId: input.campaignId, sessionId: input.sessionId, qualifiedAt: now, cooldownMs: settings.impressionCooldownMs }, { merge: true });
      transaction.update(campaignRef, { deliveredImpressions: FieldValue.increment(1), qualifiedImpressions: FieldValue.increment(1), remainingImpressions: FieldValue.increment(-1), updatedAt: now });
      transaction.update(db.collection("products").doc(input.productId), { paidImpressions: FieldValue.increment(1), updatedAt: now });
      transaction.set(dailyRef, { campaignId: input.campaignId, date, impressions: FieldValue.increment(1), qualifiedImpressions: FieldValue.increment(1), updatedAt: now }, { merge: true });
      transaction.set(db.collection("campaignDailyPlacementStats").doc([input.campaignId, date, input.placement, input.page].map(safeDocumentPart).join("_")), { campaignId: input.campaignId, date, placement: input.placement, page: input.page, impressions: FieldValue.increment(1), qualifiedImpressions: FieldValue.increment(1), updatedAt: now }, { merge: true });
      return { ok: true, qualified: true, message: "Qualified impression recorded." };
    });
  } catch (error) {
    rememberUnavailable(error);
    return { ok: false, qualified: false, message: "Unable to record impression." };
  }
}

export async function recordOutboundClick(product: Product, input: { campaignId?: string; placement?: string; page?: string; source?: string; sessionId?: string }) {
  const db = getAdminDb();
  if (!db) return { ok: false, recorded: false };
  const date = new Date().toISOString().slice(0, 10);
  const placement = input.placement ?? "outbound";
  const sessionId = input.sessionId || "anonymous";
  const clickRef = db.collection("clicks").doc([product.id, input.campaignId ?? "organic", sessionId, placement, date].map(safeDocumentPart).join("_"));
  try {
    return await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(clickRef);
      if (existing.exists) return { ok: true, recorded: false };
      const now = new Date();
      if (input.campaignId) {
        const campaignRef = db.collection("campaigns").doc(input.campaignId);
        const campaignSnap = await transaction.get(campaignRef);
        if (!campaignSnap.exists || campaignSnap.data()?.productId !== product.id || campaignSnap.data()?.status !== "ACTIVE") return { ok: false, recorded: false };
        transaction.update(campaignRef, { clicks: FieldValue.increment(1), qualifiedClicks: FieldValue.increment(1), updatedAt: now });
        transaction.set(db.collection("campaignDailyStats").doc(`${input.campaignId}_${date}`), { campaignId: input.campaignId, date, clicks: FieldValue.increment(1), qualifiedClicks: FieldValue.increment(1), updatedAt: now }, { merge: true });
        transaction.set(db.collection("campaignDailyPlacementStats").doc([input.campaignId, date, placement, input.page ?? "outbound"].map(safeDocumentPart).join("_")), { campaignId: input.campaignId, date, placement, page: input.page ?? "outbound", source: input.source ?? "direct", clicks: FieldValue.increment(1), qualifiedClicks: FieldValue.increment(1), updatedAt: now }, { merge: true });
      }
      transaction.set(clickRef, { id: clickRef.id, productId: product.id, campaignId: input.campaignId ?? "", placement, page: input.page ?? "outbound", source: input.source ?? "direct", sessionId, createdAt: now });
      const productMetrics = input.campaignId
        ? { totalClicks: FieldValue.increment(1), totalQualifiedClicks: FieldValue.increment(1), paidQualifiedClicks: FieldValue.increment(1), updatedAt: now }
        : { totalClicks: FieldValue.increment(1), totalQualifiedClicks: FieldValue.increment(1), organicQualifiedClicks: FieldValue.increment(1), updatedAt: now };
      transaction.update(db.collection("products").doc(product.id), productMetrics);
      transaction.set(db.collection("productDailyStats").doc(`${product.id}_${date}`), { productId: product.id, date, clicks: FieldValue.increment(1), qualifiedClicks: FieldValue.increment(1), ...(input.campaignId ? { paidClicks: FieldValue.increment(1), paidQualifiedClicks: FieldValue.increment(1) } : { organicClicks: FieldValue.increment(1), organicQualifiedClicks: FieldValue.increment(1) }), updatedAt: now }, { merge: true });
      return { ok: true, recorded: true };
    });
  } catch (error) {
    rememberUnavailable(error);
    return { ok: false, recorded: false };
  }
}

export async function incrementProductView(productId: string, sessionId = "anonymous") {
  const db = getAdminDb();
  if (!db) return { ok: false, recorded: false };
  const date = new Date().toISOString().slice(0, 10);
  const viewRef = db.collection("productViews").doc(`${productId}_${sessionId}_${date}`);
  const productRef = db.collection("products").doc(productId);
  try {
    return await db.runTransaction(async (transaction) => {
      const [viewSnapshot, productSnapshot] = await Promise.all([transaction.get(viewRef), transaction.get(productRef)]);
      if (!productSnapshot.exists || productSnapshot.data()?.status !== "PUBLISHED") return { ok: false, recorded: false };
      if (viewSnapshot.exists) return { ok: true, recorded: false };
      const now = new Date();
      transaction.set(viewRef, { productId, sessionId, date, createdAt: now });
      transaction.update(productRef, { totalViews: FieldValue.increment(1), organicViews: FieldValue.increment(1), updatedAt: now });
      transaction.set(db.collection("productDailyStats").doc(`${productId}_${date}`), { productId, date, views: FieldValue.increment(1), organicViews: FieldValue.increment(1), updatedAt: now }, { merge: true });
      return { ok: true, recorded: true };
    });
  } catch (error) {
    rememberUnavailable(error);
    return { ok: false, recorded: false };
  }
}

export async function listUserProductReactions(userId: string) {
  const empty = { votedProductIds: new Set<string>(), savedProductIds: new Set<string>() };
  const db = getAdminDb();
  if (!db || !userId) return empty;
  try {
    const [voteSnap, favoriteSnap] = await Promise.all([
      db.collection("productVotes").where("userId", "==", userId).get(),
      db.collection("favorites").where("userId", "==", userId).get(),
    ]);
    return {
      votedProductIds: new Set(voteSnap.docs.map((document) => String(document.data().productId ?? "")).filter(Boolean)),
      savedProductIds: new Set(favoriteSnap.docs.map((document) => String(document.data().productId ?? "")).filter(Boolean)),
    };
  } catch (error) {
    rememberUnavailable(error);
    return empty;
  }
}

export async function findActiveCampaignForProduct(productId: string) {
  const db = getAdminDb();
  if (!db) return undefined;
  try {
    const snapshot = await db.collection("campaigns").where("productId", "==", productId).where("status", "==", "ACTIVE").limit(1).get();
    return snapshot.empty ? undefined : snapshot.docs[0].id;
  } catch (error) {
    rememberUnavailable(error);
    return undefined;
  }
}
