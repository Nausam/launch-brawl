import { addDays } from "date-fns";
import { FieldValue } from "firebase-admin/firestore";
import type { PurchaseInfo } from "@freemius/sdk";
import { disableAdminDb, getAdminDb, isFirestoreUnavailableError } from "@/lib/firebase/admin";
import { bidAmountForQuota, nextFreemiusBidCents, quotaForBidAmount } from "@/lib/bidding-pricing";
import { freemiusIsConfigured, getFreemius } from "@/lib/integrations/freemius";
import { calculateCampaignImpressions } from "@/lib/utils";
import { getPlatformSettings } from "@/lib/server/settings";
import { asProduct, asRound, type StoreRecord } from "@/lib/repositories/documents";
import { randomUUID } from "node:crypto";

export type BidRecord = StoreRecord & {
  id: string;
  productId?: string;
  ownerId?: string;
  ownerEmail?: string;
  roundId?: string;
  amountCents?: number;
  status?: string;
  freemiusLicenseId?: string;
  freemiusQuota?: number;
  freemiusPlanId?: string;
  createdAt?: unknown;
};

function rememberUnavailable(error: unknown) {
  if (isFirestoreUnavailableError(error)) disableAdminDb();
}

function eventDocumentId(eventId: string) {
  return eventId.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function licenseDocumentId(licenseId: string) {
  return licenseId.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function freemiusPendingBidId(ownerId: string, roundId: string, productId: string) {
  return `freemius_${ownerId}_${roundId}_${productId}_${randomUUID()}`;
}

export async function findPendingFreemiusCheckout(ownerId: string, currentBidId?: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snapshot = await db.collection("bids").where("ownerId", "==", ownerId).limit(25).get();
  const candidate = snapshot.docs.find((doc) => {
    const data = doc.data();
    return doc.id !== currentBidId && data.paymentProvider === "freemius" && data.status === "PENDING";
  });
  return candidate ?? null;
}

export async function recordPendingFreemiusCheckout(input: {
  bidId: string;
  productId: string;
  roundId: string;
  ownerId: string;
  ownerEmail: string;
  amountCents: number;
  quota: number;
  planId: string;
}) {
  const db = getAdminDb();
  if (!db) throw new Error("Firestore is not configured.");
  await db.collection("bids").doc(input.bidId).set({
    id: input.bidId,
    productId: input.productId,
    ownerId: input.ownerId,
    ownerEmail: normalizeEmail(input.ownerEmail),
    roundId: input.roundId,
    amountCents: input.amountCents,
    status: "PENDING",
    paymentProvider: "freemius",
    freemiusPlanId: input.planId,
    freemiusQuota: input.quota,
    createdAt: new Date(),
    updatedAt: new Date(),
  }, { merge: true });
}

export async function markFreemiusCheckoutFailed(bidId: string, reason: string) {
  const db = getAdminDb();
  if (!db) return;
  await db.collection("bids").doc(bidId).set({
    status: "FAILED",
    failureReason: reason,
    updatedAt: new Date(),
  }, { merge: true });
}

async function findPendingPurchaseBid(purchase: PurchaseInfo) {
  const db = getAdminDb();
  if (!db || !purchase.email || purchase.quota === null || !purchase.quota) return null;
  const snapshot = await db.collection("bids").where("ownerEmail", "==", normalizeEmail(purchase.email)).limit(25).get();
  const candidate = snapshot.docs.find((doc) => {
    const data = doc.data();
    return data.paymentProvider === "freemius" &&
      data.status === "PENDING" &&
      String(data.freemiusPlanId ?? "") === purchase.planId &&
      Number(data.freemiusQuota ?? 0) === purchase.quota;
  });
  return candidate ?? null;
}

export async function activateFreemiusPurchase(eventId: string, purchase: PurchaseInfo) {
  const db = getAdminDb();
  if (!db) return { ok: false, retryable: true, message: "Firestore is not configured." };
  const quota = purchase.quota;
  const amountCents = quota === null ? 0 : bidAmountForQuota(quota);
  const configuredQuota = quota === null ? null : quotaForBidAmount(amountCents);
  const existingLicense = await db.collection("freemiusLicenses").doc(licenseDocumentId(purchase.licenseId)).get();
  if (existingLicense.exists && existingLicense.data()?.bidId) {
    await db.collection("freemiusEvents").doc(eventDocumentId(eventId)).set({ id: eventId, type: "license.created.replay", licenseId: purchase.licenseId, bidId: existingLicense.data()?.bidId, processedAt: new Date() }, { merge: true });
    return { ok: true, message: "Already activated." };
  }
  const pendingBid = configuredQuota ? await findPendingPurchaseBid(purchase) : null;
  if (!pendingBid || !configuredQuota || purchase.canceled) {
    const retryable = !purchase.canceled && Boolean(configuredQuota) && !pendingBid;
    const recordId = retryable ? `${eventId}_waiting` : eventId;
    await db.collection("freemiusEvents").doc(eventDocumentId(recordId)).set({
      id: eventId,
      type: retryable ? "license.created.waiting_for_pending_bid" : "license.created.unmatched",
      licenseId: purchase.licenseId,
      email: normalizeEmail(purchase.email),
      planId: purchase.planId,
      quota: purchase.quota,
      processedAt: new Date(),
    }, { merge: true });
    return {
      ok: false,
      retryable,
      message: purchase.canceled ? "The Freemius license is canceled." : "No matching pending Freemius checkout was found.",
    };
  }

  const settings = await getPlatformSettings();
  const impressions = calculateCampaignImpressions(amountCents, settings.promoImpressionsPerDollar);
  const now = new Date();

  try {
    return await db.runTransaction(async (transaction) => {
      const eventRef = db.collection("freemiusEvents").doc(eventDocumentId(eventId));
      const licenseRef = db.collection("freemiusLicenses").doc(licenseDocumentId(purchase.licenseId));
      const eventSnap = await transaction.get(eventRef);
      if (eventSnap.exists) return { ok: true, message: "Already processed." } as const;
      const licenseSnap = await transaction.get(licenseRef);
      if (licenseSnap.exists && licenseSnap.data()?.bidId) {
        transaction.set(eventRef, { id: eventId, type: "license.created", bidId: licenseSnap.data()?.bidId, processedAt: now }, { merge: true });
        return { ok: true, message: "Already activated." } as const;
      }

      const bidRef = pendingBid.ref;
      const bidSnap = await transaction.get(bidRef);
      if (!bidSnap.exists || bidSnap.data()?.status !== "PENDING") {
        transaction.set(eventRef, { id: eventId, type: "license.created.no_pending_bid", licenseId: purchase.licenseId, processedAt: now }, { merge: true });
        return { ok: false, retryable: false, message: "The pending checkout is no longer available." } as const;
      }
      const bid = bidSnap.data() ?? {};
      const productId = String(bid.productId ?? "");
      const roundId = String(bid.roundId ?? "");
      const ownerId = String(bid.ownerId ?? "");
      if (!productId || !roundId || !ownerId || String(bid.freemiusPlanId ?? "") !== purchase.planId || Number(bid.freemiusQuota ?? 0) !== quota) {
        transaction.set(eventRef, { id: eventId, type: "license.created.invalid_pending_bid", licenseId: purchase.licenseId, processedAt: now }, { merge: true });
        return { ok: false, retryable: false, message: "The Freemius purchase did not match its pending bid." } as const;
      }

      const productRef = db.collection("products").doc(productId);
      const roundRef = db.collection("leaderboardRounds").doc(roundId);
      const campaignId = `campaign_${pendingBid.id}`;
      const campaignRef = db.collection("campaigns").doc(campaignId);
      const activeBidSnapshot = await transaction.get(db.collection("bids").where("roundId", "==", roundId).where("status", "==", "ACTIVE").orderBy("amountCents", "desc").limit(100));
      const [productSnap, roundSnap] = await Promise.all([transaction.get(productRef), transaction.get(roundRef)]);
      if (!productSnap.exists || !roundSnap.exists) throw new Error("Product or round not found.");
      const product = asProduct(productSnap.id, productSnap.data() as StoreRecord);
      const round = asRound(roundSnap.id, roundSnap.data() as StoreRecord);
      if (product.ownerId !== ownerId || round.status !== "ACTIVE") throw new Error("Checkout no longer matches an active owned product.");

      const currentHighest = round.winningBidCents ?? 0;
      const previousLeader = activeBidSnapshot.docs.find((document) => document.id !== pendingBid.id && Number(document.data()?.amountCents ?? 0) === currentHighest);
      const minimumCents = nextFreemiusBidCents(currentHighest, settings.minimumBidCents, settings.minimumIncrementCents);
      if (!minimumCents || amountCents < minimumCents || amountCents > settings.maximumBidCents) {
        transaction.set(bidRef, {
          id: pendingBid.id,
          amountCents,
          status: "FAILED",
          failureReason: "The bid became stale before Freemius payment confirmation.",
          freemiusLicenseId: purchase.licenseId,
          updatedAt: now,
        }, { merge: true });
        transaction.set(eventRef, { id: eventId, type: "license.created.stale", bidId: pendingBid.id, licenseId: purchase.licenseId, processedAt: now }, { merge: true });
        return { ok: false, retryable: false, message: "The bid was no longer valid when payment completed." } as const;
      }

      const takesLead = amountCents > currentHighest;
      transaction.set(bidRef, {
        id: pendingBid.id,
        productId,
        ownerId,
        roundId,
        amountCents,
        status: "ACTIVE",
        paymentProvider: "freemius",
        freemiusLicenseId: purchase.licenseId,
        freemiusPricingId: purchase.pricingId,
        freemiusUserId: purchase.userId,
        freemiusQuota: quota,
        campaignId,
        createdAt: bid.createdAt ?? now,
        paidAt: now,
        updatedAt: now,
      }, { merge: true });
      transaction.set(licenseRef, { licenseId: purchase.licenseId, bidId: pendingBid.id, campaignId, roundId, productId, ownerId, quota, updatedAt: now }, { merge: true });
      transaction.set(campaignRef, {
        id: campaignId,
        bidId: pendingBid.id,
        productId,
        productName: product.name,
        ownerId,
        status: settings.newCampaignsPaused || !settings.featureFlags.campaignDeliveryEnabled ? "PAUSED" : "ACTIVE",
        purchasedAmountCents: amountCents,
        purchasedImpressions: impressions,
        deliveredImpressions: 0,
        qualifiedImpressions: 0,
        remainingImpressions: impressions,
        clicks: 0,
        qualifiedClicks: 0,
        startedAt: now,
        expiresAt: addDays(now, 7),
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      transaction.update(productRef, {
        ...(takesLead ? { bidCents: amountCents, previousPosition: product.position, trend: "up" } : {}),
        updatedAt: now,
      });
      transaction.update(roundRef, {
        totalRevenueCents: FieldValue.increment(amountCents),
        ...(takesLead ? { winningProductId: productId, winningBidCents: amountCents } : {}),
        updatedAt: now,
      });
      if (takesLead && previousLeader?.data()?.ownerId && String(previousLeader.data()?.ownerId) !== ownerId) {
        const outbidUserId = String(previousLeader.data()?.ownerId);
        const notificationId = `BID_OUTBID_${outbidUserId}_${roundId}`;
        transaction.set(db.collection("notifications").doc(notificationId), { id: notificationId, userId: outbidUserId, type: "BID_OUTBID", title: "Your bid was outbid", body: "Another paid bid now holds the leading sponsored position. Your campaign allocation remains separate and unchanged.", entityId: roundId, read: false, emailStatus: "SKIPPED", createdAt: now, updatedAt: now }, { merge: true });
      }
      transaction.set(eventRef, { id: eventId, type: "license.created", bidId: pendingBid.id, campaignId, licenseId: purchase.licenseId, processedAt: now }, { merge: true });
      return { ok: true, message: "Bid activated and campaign allocated." } as const;
    });
  } catch (error) {
    rememberUnavailable(error);
    return { ok: false, retryable: true, message: "Unable to activate this payment." };
  }
}

export type FreemiusReconciliationSummary = {
  pendingBids: number;
  accountsChecked: number;
  purchasesChecked: number;
  activated: number;
  errors: number;
};

function emptyFreemiusReconciliationSummary(): FreemiusReconciliationSummary {
  return { pendingBids: 0, accountsChecked: 0, purchasesChecked: 0, activated: 0, errors: 0 };
}

/**
 * Recover paid checkouts when a redirect or webhook is delayed or unavailable.
 * Freemius remains the source of truth; activation is transaction-backed and idempotent.
 */
export async function reconcilePendingFreemiusPurchases(ownerEmail?: string): Promise<FreemiusReconciliationSummary> {
  const summary = emptyFreemiusReconciliationSummary();
  const db = getAdminDb();
  const freemius = getFreemius();
  if (!db || !freemius || !freemiusIsConfigured()) return summary;

  try {
    const snapshot = await db.collection("bids").where("status", "==", "PENDING").limit(200).get();
    const expectedEmail = ownerEmail ? normalizeEmail(ownerEmail) : null;
    const emails = new Set<string>();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.paymentProvider !== "freemius") continue;
      const email = typeof data.ownerEmail === "string" ? normalizeEmail(data.ownerEmail) : "";
      if (!email || (expectedEmail && email !== expectedEmail)) continue;
      summary.pendingBids += 1;
      emails.add(email);
    }

    for (const email of emails) {
      summary.accountsChecked += 1;
      let purchases: PurchaseInfo[];
      try {
        purchases = await freemius.purchase.retrievePurchasesByEmail(email);
      } catch {
        summary.errors += 1;
        continue;
      }

      for (const purchase of purchases) {
        summary.purchasesChecked += 1;
        const pendingBid = await findPendingPurchaseBid(purchase);
        if (!pendingBid) continue;
        const result = await activateFreemiusPurchase(`reconcile_${purchase.licenseId}`, purchase);
        if (result.ok && result.message === "Bid activated and campaign allocated.") summary.activated += 1;
        if (!result.ok && result.retryable) summary.errors += 1;
      }
    }
  } catch (error) {
    rememberUnavailable(error);
    summary.errors += 1;
  }

  return summary;
}

export async function revokeFreemiusLicense(eventId: string, licenseId: string, type: "license.cancelled" | "license.deleted" | "license.expired") {
  const db = getAdminDb();
  if (!db) return { ok: false, message: "Firestore is not configured." };
  try {
    return await db.runTransaction(async (transaction) => {
      const eventRef = db.collection("freemiusEvents").doc(eventDocumentId(eventId));
      const eventSnap = await transaction.get(eventRef);
      if (eventSnap.exists) return { ok: true, message: "Already processed." } as const;
      const licenseRef = db.collection("freemiusLicenses").doc(licenseDocumentId(licenseId));
      const licenseSnap = await transaction.get(licenseRef);
      const bidId = String(licenseSnap.data()?.bidId ?? "");
      if (!bidId) {
        transaction.set(eventRef, { id: eventId, type, licenseId, processedAt: new Date() }, { merge: true });
        return { ok: true, message: "License event recorded without a local bid." } as const;
      }
      const bidRef = db.collection("bids").doc(bidId);
      const bidSnap = await transaction.get(bidRef);
      if (!bidSnap.exists) {
        transaction.set(eventRef, { id: eventId, type, licenseId, processedAt: new Date() }, { merge: true });
        return { ok: true, message: "License event recorded without a local bid." } as const;
      }
      const bid = bidSnap.data() ?? {};
      const now = new Date();
      const targetStatus = type === "license.deleted" ? "REFUNDED" : type === "license.expired" ? "EXPIRED" : "CANCELLED";
      const targetCampaignStatus = type === "license.deleted" ? "REFUNDED" : type === "license.expired" ? "EXPIRED" : "PAUSED";
      if (["REFUNDED", "EXPIRED"].includes(String(bid.status)) || (String(bid.status) === "CANCELLED" && type !== "license.deleted")) {
        transaction.set(eventRef, { id: eventId, type, bidId, processedAt: now }, { merge: true });
        return { ok: true, message: "Bid already reconciled." } as const;
      }
      const campaignId = String(bid.campaignId ?? `campaign_${bidId}`);
      const roundId = String(bid.roundId ?? "");
      const productId = String(bid.productId ?? "");
      const amountCents = Number(bid.amountCents ?? 0);
      const campaignRef = db.collection("campaigns").doc(campaignId);
      const roundRef = db.collection("leaderboardRounds").doc(roundId);
      const productRef = db.collection("products").doc(productId);
      const [campaignSnap, roundSnap, productSnap] = await Promise.all([transaction.get(campaignRef), transaction.get(roundRef), transaction.get(productRef)]);
      const isWinner = roundSnap.exists && productSnap.exists && roundSnap.data()?.winningProductId === productId;
      const replacement = isWinner
        ? await transaction.get(db.collection("bids").where("roundId", "==", roundId).where("status", "==", "ACTIVE").orderBy("amountCents", "desc").limit(100))
        : undefined;
      const next = replacement?.docs.find((doc) => doc.id !== bidId);
      transaction.update(bidRef, { status: targetStatus, freemiusRevocationType: type, revokedAt: now, updatedAt: now });
      if (campaignSnap.exists) transaction.update(campaignRef, { status: targetCampaignStatus, updatedAt: now });
      if (roundSnap.exists) {
        transaction.update(roundRef, {
          totalRevenueCents: FieldValue.increment(-amountCents),
          ...(isWinner ? { winningProductId: next?.data()?.productId ?? "", winningBidCents: typeof next?.data()?.amountCents === "number" ? next.data()?.amountCents : 0 } : {}),
          updatedAt: now,
        });
      }
      if (isWinner && roundSnap.exists && productSnap.exists) {
        transaction.update(productRef, { bidCents: 0, position: 0, updatedAt: now });
        if (next?.data()?.productId) transaction.update(db.collection("products").doc(String(next.data()?.productId)), { bidCents: Number(next.data()?.amountCents ?? 0), updatedAt: now });
      }
      transaction.set(licenseRef, { status: targetStatus, updatedAt: now }, { merge: true });
      transaction.set(eventRef, { id: eventId, type, bidId, licenseId, processedAt: now }, { merge: true });
      return { ok: true, message: `${targetStatus} reconciliation recorded.` } as const;
    });
  } catch (error) {
    rememberUnavailable(error);
    return { ok: false, message: "Unable to reconcile the Freemius license event." };
  }
}

export async function requestFreemiusRefund(bidId: string, adminId: string) {
  const db = getAdminDb();
  if (!db) return { ok: false, message: "Firestore is not configured." };
  const bidRef = db.collection("bids").doc(bidId);
  const snapshot = await bidRef.get();
  if (!snapshot.exists) return { ok: false, message: "Bid not found." };
  const data = snapshot.data() ?? {};
  if (!data.freemiusLicenseId) return { ok: false, message: "This bid has no Freemius license to reconcile." };
  if (!["ACTIVE", "PAID"].includes(String(data.status))) return { ok: false, message: "Only active paid bids can be refunded." };
  const now = new Date();
  await bidRef.set({ status: "REFUND_PENDING", refundRequestedAt: now, refundRequestedBy: adminId, updatedAt: now }, { merge: true });
  await db.collection("adminAuditLogs").add({ adminId, action: "BID_REFUND_REQUESTED", targetType: "bid", targetId: bidId, freemiusLicenseId: data.freemiusLicenseId, createdAt: now });
  return { ok: true, message: "Refund request recorded. Complete the refund in Freemius Payments; the license webhook will reconcile this bid." };
}

export async function listBids(limit = 40): Promise<BidRecord[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("bids").orderBy("createdAt", "desc").limit(limit).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as StoreRecord) }) as BidRecord);
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function listCampaigns(limit = 40) {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("campaigns").orderBy("createdAt", "desc").limit(limit).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as StoreRecord) }));
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}
