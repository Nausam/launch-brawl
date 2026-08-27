import { getAdminDb } from "@/lib/firebase/admin";
import { asCampaign, asDeal, asUser, type StoreRecord } from "@/lib/repositories/documents";
import { normalizeBrawl } from "@/lib/server/brawl-service";
import { listProductsByStatus } from "@/lib/repositories/catalog";
import { listBids, listCampaigns } from "@/lib/repositories/payments";
import type { AppUser, Brawl, Campaign, Deal, Product } from "@/lib/types";

async function count(query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> | FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>) {
  try {
    const result = await query.count().get();
    return result.data().count;
  } catch {
    return 0;
  }
}

export async function getAdminMetrics() {
  const db = getAdminDb();
  if (!db) return { users: 0, publishedProducts: 0, pendingProducts: 0, liveBrawls: 0, completedBrawls: 0, brawlVotes: 0, paidBids: 0, activeCampaigns: 0, impressions: 0, clicks: 0, unreadNotifications: 0 };
  const [users, publishedProducts, pendingProducts, liveBrawls, completedBrawls, brawlVotes, paidBids, activeCampaigns, impressions, clicks, unreadNotifications] = await Promise.all([
    count(db.collection("users")),
    count(db.collection("products").where("status", "==", "PUBLISHED")),
    count(db.collection("products").where("status", "==", "PENDING")),
    count(db.collection("brawls").where("status", "==", "LIVE")),
    count(db.collection("brawls").where("status", "==", "COMPLETED")),
    count(db.collection("brawlVotes")),
    count(db.collection("bids").where("status", "in", ["PAID", "ACTIVE"])),
    count(db.collection("campaigns").where("status", "==", "ACTIVE")),
    count(db.collection("impressions")),
    count(db.collection("clicks")),
    count(db.collection("notifications").where("read", "==", false)),
  ]);
  return { users, publishedProducts, pendingProducts, liveBrawls, completedBrawls, brawlVotes, paidBids, activeCampaigns, impressions, clicks, unreadNotifications };
}

export async function listAdminProducts(limit = 100): Promise<Product[]> {
  const statuses: Product["status"][] = ["PENDING", "PUBLISHED", "REJECTED", "ARCHIVED", "DRAFT"];
  const lists = await Promise.all(statuses.map((status) => listProductsByStatus(status, Math.ceil(limit / statuses.length))));
  return lists.flat().sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
}

export async function listAdminUsers(limit = 100): Promise<AppUser[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").limit(limit).get();
    return snapshot.docs.map((doc) => asUser(doc.id, doc.data() as StoreRecord));
  } catch {
    return [];
  }
}

export async function listAdminBrawls(limit = 100): Promise<Brawl[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("brawls").orderBy("createdAt", "desc").limit(limit).get();
    return snapshot.docs.map((doc) => normalizeBrawl(doc.id, doc.data())).filter((brawl): brawl is Brawl => Boolean(brawl));
  } catch {
    return [];
  }
}

export async function listAdminCampaigns(limit = 100): Promise<Campaign[]> {
  const raw = await listCampaigns(limit);
  return raw.map((item) => asCampaign(item.id, item as StoreRecord));
}

export async function listAdminDeals(limit = 100): Promise<Deal[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("deals").limit(limit).get();
    return snapshot.docs.map((document) => asDeal(document.id, document.data() as StoreRecord)).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  } catch {
    return [];
  }
}

export async function listAdminBids(limit = 100) {
  return listBids(limit);
}

export async function getCampaignDailySeries(campaignId: string, days = 30) {
  const db = getAdminDb();
  if (!db) return [] as Array<{ day: string; impressions: number; clicks: number }>;
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  try {
    const snapshot = await db.collection("campaignDailyStats").where("campaignId", "==", campaignId).where("date", ">=", since).orderBy("date", "asc").limit(days).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data() as StoreRecord;
      return { day: String(data.date ?? doc.id), impressions: typeof data.impressions === "number" ? data.impressions : 0, clicks: typeof data.clicks === "number" ? data.clicks : 0 };
    });
  } catch {
    return [];
  }
}

export async function getPlatformDailySeries(days = 30) {
  const db = getAdminDb();
  if (!db) return [] as Array<{ day: string; impressions: number; clicks: number }>;
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  try {
    const snapshot = await db.collection("campaignDailyStats").where("date", ">=", since).orderBy("date", "asc").limit(days * 100).get();
    const byDay = new Map<string, { impressions: number; clicks: number }>();
    for (const doc of snapshot.docs) {
      const data = doc.data() as StoreRecord;
      const day = String(data.date ?? doc.id);
      const current = byDay.get(day) ?? { impressions: 0, clicks: 0 };
      current.impressions += typeof data.impressions === "number" ? data.impressions : 0;
      current.clicks += typeof data.clicks === "number" ? data.clicks : 0;
      byDay.set(day, current);
    }
    return [...byDay.entries()].map(([day, values]) => ({ day, ...values }));
  } catch {
    return [];
  }
}

export async function getGamificationAdminMetrics() {
  const db = getAdminDb();
  if (!db) return { liveBrawls: 0, pendingChallenges: 0, productsWithRecords: 0, currentSeason: "" };
  const [liveBrawls, pendingChallenges, productsWithRecords, season] = await Promise.all([
    count(db.collection("brawls").where("status", "==", "LIVE")),
    count(db.collection("brawlChallenges").where("status", "==", "PENDING")),
    count(db.collection("productCompetitiveStats").where("totalBrawls", ">", 0)),
    db.collection("brawlSeasons").where("current", "==", true).limit(1).get().catch(() => null),
  ]);
  return { liveBrawls, pendingChallenges, productsWithRecords, currentSeason: season?.docs[0]?.data()?.name ? String(season.docs[0].data()?.name) : "" };
}

export async function listAdminAuditLogs(limit = 100, query = "") {
  const db = getAdminDb();
  if (!db) return [] as Array<{ id: string; actorId: string; action: string; entityType: string; entityId: string; requestId: string; metadata: Record<string, unknown>; createdAt: string }>;
  try {
    const snapshot = await db.collection("adminAuditLogs").limit(Math.min(500, limit * 4)).get();
    const normalized = snapshot.docs.map((document) => {
      const data = document.data();
      const createdAt = data.createdAt && typeof data.createdAt === "object" && "toDate" in data.createdAt && typeof data.createdAt.toDate === "function" ? data.createdAt.toDate().toISOString() : typeof data.createdAt === "string" ? data.createdAt : new Date(0).toISOString();
      return { id: document.id, actorId: String(data.actorId ?? data.adminId ?? ""), action: String(data.action ?? ""), entityType: String(data.entityType ?? data.targetType ?? ""), entityId: String(data.entityId ?? data.targetId ?? ""), requestId: String(data.requestId ?? ""), metadata: data.metadata && typeof data.metadata === "object" ? data.metadata as Record<string, unknown> : { reason: data.reason ?? "" }, createdAt };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const needle = query.trim().toLowerCase();
    return normalized.filter((entry) => !needle || `${entry.actorId} ${entry.action} ${entry.entityType} ${entry.entityId}`.toLowerCase().includes(needle)).slice(0, limit);
  } catch {
    return [];
  }
}

export async function listPendingProductClaims(limit = 50) {
  const db = getAdminDb();
  if (!db) return [] as Array<{ id: string; productId: string; claimantUserId: string; evidence: string; createdAt: string }>;
  try {
    const snapshot = await db.collection("productClaims").where("status", "==", "PENDING").limit(limit).get();
    return snapshot.docs.map((document) => { const data = document.data(); const createdAt = data.createdAt && typeof data.createdAt === "object" && "toDate" in data.createdAt && typeof data.createdAt.toDate === "function" ? data.createdAt.toDate().toISOString() : String(data.createdAt ?? ""); return { id: document.id, productId: String(data.productId ?? ""), claimantUserId: String(data.claimantUserId ?? ""), evidence: String(data.evidence ?? ""), createdAt }; });
  } catch {
    return [];
  }
}
