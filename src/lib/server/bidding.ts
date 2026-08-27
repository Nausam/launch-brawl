import { calculateCampaignImpressions } from "@/lib/utils";
import { nextFreemiusBidCents, quotaForBidAmount } from "@/lib/bidding-pricing";
import { getAdminDb } from "@/lib/firebase/admin";
import { asProduct, asRound, type StoreRecord } from "@/lib/repositories/documents";
import { getCurrentRound } from "@/lib/repositories/catalog";
import { defaultPlatformSettings, getPlatformSettings } from "@/lib/server/settings";
import type { LeaderboardRound } from "@/lib/types";

export const biddingSettings = defaultPlatformSettings;

export function validateBid({
  amountCents,
  currentHighestCents,
  round,
  settings = defaultPlatformSettings,
}: {
  amountCents: number;
  currentHighestCents: number;
  round: LeaderboardRound;
  settings?: Pick<typeof defaultPlatformSettings, "minimumBidCents" | "minimumIncrementCents" | "maximumBidCents" | "promoImpressionsPerDollar" | "biddingPaused">;
}) {
  if (settings.biddingPaused) return { valid: false, reason: "Bidding is temporarily paused." } as const;
  if (round.status !== "ACTIVE") return { valid: false, reason: "This brawl round is no longer active." } as const;
  const quota = quotaForBidAmount(amountCents);
  if (!quota) return { valid: false, reason: "Choose one of the supported Freemius bid amounts." } as const;
  const minimumCents = nextFreemiusBidCents(currentHighestCents, settings.minimumBidCents, settings.minimumIncrementCents);
  if (!minimumCents) return { valid: false, reason: "There are no larger supported bid amounts available for this round." } as const;
  if (amountCents < minimumCents) return { valid: false, reason: `Your bid must be at least ${minimumCents} cents.` } as const;
  if (amountCents > settings.maximumBidCents) return { valid: false, reason: "This bid exceeds the configured maximum." } as const;
  return { valid: true, minimumCents, quota, purchasedImpressions: calculateCampaignImpressions(amountCents, settings.promoImpressionsPerDollar) } as const;
}

export async function finalizeRound(roundId: string) {
  const db = getAdminDb();
  if (!db) return { finalized: false, mode: "unconfigured", reason: "Firestore is not configured." } as const;
  const roundRef = db.collection("leaderboardRounds").doc(roundId);
  return db.runTransaction(async (transaction) => {
    const roundSnapshot = await transaction.get(roundRef);
    if (!roundSnapshot.exists) return { finalized: false, mode: "firestore", reason: "Round not found." } as const;
    const round = asRound(roundSnapshot.id, roundSnapshot.data() as StoreRecord);
    if (round.status === "COMPLETED") return { finalized: true, mode: "firestore", reason: "Already finalized." } as const;
    const bids = await transaction.get(db.collection("bids").where("roundId", "==", roundId).where("status", "==", "ACTIVE").orderBy("amountCents", "desc").limit(100));
    const productIds = bids.docs.map((doc) => String(doc.data()?.productId ?? "")).filter(Boolean);
    const productSnapshots = await Promise.all(productIds.map((productId) => transaction.get(db.collection("products").doc(productId))));
    const products = productSnapshots.map((snapshot) => snapshot.exists ? asProduct(snapshot.id, snapshot.data() as StoreRecord) : undefined).filter((product): product is ReturnType<typeof asProduct> => Boolean(product));
    const byId = new Map(products.map((product) => [product.id, product]));
    const winnerBid = bids.docs.find((doc) => byId.get(String(doc.data()?.productId ?? ""))?.status === "PUBLISHED");
    const winner = winnerBid ? byId.get(String(winnerBid.data()?.productId ?? "")) : undefined;
    const winningBidCents = typeof winnerBid?.data()?.amountCents === "number" ? winnerBid.data()?.amountCents as number : 0;
    transaction.update(roundRef, {
      status: "COMPLETED",
      finalizedAt: new Date(),
      winningProductId: winner?.id ?? "",
      winningBidCents,
    });
    if (winner) {
      transaction.set(db.collection("dailyWinners").doc(roundId), {
        id: roundId,
        date: roundId.replace("brawl-", ""),
        productId: winner.id,
        productName: winner.name,
        productSlug: winner.slug,
        winningBidCents,
        views: winner.totalViews,
        clicks: winner.totalQualifiedClicks,
        category: winner.categoryId,
        makerName: winner.makerName,
        createdAt: new Date(),
      });
    }
    return { finalized: true, mode: "firestore", reason: "Round finalized idempotently." } as const;
  });
}

export async function loadBidContext() {
  const [round, settings] = await Promise.all([getCurrentRound(), getPlatformSettings()]);
  return { round, settings };
}

export async function runRoundLifecycleJob() {
  const db = getAdminDb();
  if (!db) return { mode: "unconfigured" as const, finalized: 0, created: false, errors: ["Firestore is not configured."] };
  const now = Date.now();
  const expired = await db.collection("leaderboardRounds").where("status", "==", "ACTIVE").where("endsAt", "<=", new Date(now)).limit(50).get().catch(() => ({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] }));
  let finalized = 0;
  const errors: string[] = [];
  for (const document of expired.docs) {
    const result = await finalizeRound(document.id);
    if (result.finalized) finalized += 1; else errors.push(`${document.id}: ${result.reason}`);
  }
  const active = await db.collection("leaderboardRounds").where("status", "==", "ACTIVE").limit(1).get();
  if (!active.empty) return { mode: "firestore" as const, finalized, created: false, errors };
  const upcoming = await db.collection("leaderboardRounds").where("status", "==", "UPCOMING").where("startsAt", "<=", new Date(now)).limit(1).get().catch(() => ({ empty: true, docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] }));
  if (!upcoming.empty) {
    await upcoming.docs[0].ref.update({ status: "ACTIVE", updatedAt: new Date() });
    return { mode: "firestore" as const, finalized, created: false, errors };
  }
  const day = new Date(now).toISOString().slice(0, 10);
  const roundId = `round_${day}`;
  const roundRef = db.collection("leaderboardRounds").doc(roundId);
  const created = await db.runTransaction(async (transaction) => {
    const current = await transaction.get(roundRef);
    if (current.exists) return false;
    const startsAt = new Date(now);
    const endsAt = new Date(now + 24 * 60 * 60 * 1000);
    transaction.set(roundRef, { id: roundId, startsAt, endsAt, status: "ACTIVE", totalRevenueCents: 0, winningBidCents: 0, createdAt: startsAt, updatedAt: startsAt });
    return true;
  });
  return { mode: "firestore" as const, finalized, created, errors };
}
