import { disableAdminDb, getAdminDb, isFirestoreUnavailableError } from "@/lib/firebase/admin";
import { calculateTrendingScore } from "@/lib/utils";
import type { Category, Deal, LeaderboardRound, Product, ProductLaunchEvent, Winner } from "@/lib/types";
import { asCategory, asIso, asProduct, asRound, asWinner, searchTokens, type StoreRecord } from "@/lib/repositories/documents";
import { isSeedDataEnabled } from "@/lib/server/runtime";
import { isBlockedHost } from "@/lib/server/website-metadata";
import { categories as seedCategories, getCurrentRound as getSeedCurrentRound, getLeaderboard as getSeedLeaderboard, getProductById as getSeedProductById, getProductBySlug as getSeedProductBySlug, getProductsForCategory as getSeedProductsForCategory, products as seedProducts, winnerHistory as seedWinnerHistory } from "@/lib/data";

function rememberUnavailable(error: unknown) {
  if (isFirestoreUnavailableError(error)) disableAdminDb();
}

async function readCollection<T>(name: string, map: (id: string, data: StoreRecord) => T, limit = 200) {
  const db = getAdminDb();
  if (!db) return [] as T[];
  try {
    const snapshot = await db.collection(name).limit(limit).get();
    return snapshot.docs.map((doc) => map(doc.id, doc.data() as StoreRecord));
  } catch (error) {
    rememberUnavailable(error);
    return [] as T[];
  }
}

export async function listCategories(): Promise<Category[]> {
  const remote = await readCollection("categories", asCategory, 50);
  const active = remote.filter((category) => category.active).sort((a, b) => a.displayOrder - b.displayOrder);
  return active.length || !isSeedDataEnabled() ? active : seedCategories;
}

export async function findCategoryBySlug(slug: string) {
  const categories = await listCategories();
  return categories.find((category) => category.slug === slug || category.id === slug);
}

export async function findCategory(idOrSlug: string) {
  const categories = await listCategories();
  return categories.find((category) => category.id === idOrSlug || category.slug === idOrSlug);
}

export async function listPublishedProducts(limit = 120): Promise<Product[]> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? seedProducts.slice(0, limit) : [];
  try {
    const snapshot = await db.collection("products").where("status", "==", "PUBLISHED").limit(limit).get();
    return snapshot.docs.map((doc) => asProduct(doc.id, doc.data() as StoreRecord));
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? seedProducts.slice(0, limit) : [];
  }
}

export async function listProductsByStatus(status: Product["status"], limit = 80): Promise<Product[]> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? seedProducts.filter((product) => product.status === status).slice(0, limit) : [];
  try {
    const snapshot = await db.collection("products").where("status", "==", status).limit(limit).get();
    return snapshot.docs.map((doc) => asProduct(doc.id, doc.data() as StoreRecord));
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? seedProducts.filter((product) => product.status === status).slice(0, limit) : [];
  }
}

export async function findProductById(id: string) {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? getSeedProductById(id) : undefined;
  try {
    const snapshot = await db.collection("products").doc(id).get();
    return snapshot.exists ? asProduct(snapshot.id, snapshot.data() as StoreRecord) : undefined;
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? getSeedProductById(id) : undefined;
  }
}

export async function findProductBySlug(slug: string) {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? getSeedProductBySlug(slug) : undefined;
  try {
    const snapshot = await db.collection("products").where("slug", "==", slug).limit(1).get();
    if (snapshot.empty) return undefined;
    return asProduct(snapshot.docs[0].id, snapshot.docs[0].data() as StoreRecord);
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? getSeedProductBySlug(slug) : undefined;
  }
}

export async function getProductLaunchEvent(productId: string): Promise<ProductLaunchEvent | undefined> {
  const db = getAdminDb();
  if (!db) return undefined;
  try {
    const snapshot = await db.collection("launchEvents").doc(productId).get();
    if (!snapshot.exists) return undefined;
    const data = snapshot.data() as StoreRecord;
    const eventUrl = typeof data.eventUrl === "string" ? (() => { try { const url = new URL(data.eventUrl as string); return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password && !isBlockedHost(url.hostname) ? data.eventUrl as string : undefined; } catch { return undefined; } })() : undefined;
    const status = data.status === "LIVE" || data.status === "COMPLETED" ? data.status : "SCHEDULED";
    const eventType = ["LAUNCH", "DEMO", "WEBINAR", "RELEASE"].includes(String(data.eventType)) ? String(data.eventType) as ProductLaunchEvent["eventType"] : undefined;
    const iso = (value: unknown) => value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function" ? value.toDate().toISOString() : typeof value === "string" ? value : undefined;
    return { id: snapshot.id, productId, status, tagline: typeof data.tagline === "string" ? data.tagline : undefined, eventType, eventAt: iso(data.eventAt), eventUrl, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt) };
  } catch (error) {
    rememberUnavailable(error);
    return undefined;
  }
}

export async function getProductsByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [] as Product[];
  const products = await Promise.all(unique.map((id) => findProductById(id)));
  return products.filter((product): product is Product => Boolean(product));
}

export async function getProductsForCategory(slug: string) {
  const category = await findCategoryBySlug(slug);
  if (!category) return [];
  if (!getAdminDb() && isSeedDataEnabled()) return getSeedProductsForCategory(slug);
  const products = await listPublishedProducts();
  return products.filter((product) => product.categoryId === category.id);
}

export function rankTrending(products: Product[]) {
  return [...products].sort((a, b) => {
    const aScore = calculateTrendingScore({
      votes: a.organicVotes ?? (isSeedDataEnabled() ? a.totalVotes : 0),
      qualifiedClicks: a.organicQualifiedClicks ?? (isSeedDataEnabled() ? a.totalQualifiedClicks : 0),
      favorites: a.organicFavorites ?? (isSeedDataEnabled() ? a.totalFavorites : 0),
      views: a.organicViews ?? (isSeedDataEnabled() ? a.totalViews : 0),
      ageHours: Math.max(2, (Date.now() - new Date(a.launchDate).getTime()) / 3_600_000),
    });
    const bScore = calculateTrendingScore({
      votes: b.organicVotes ?? (isSeedDataEnabled() ? b.totalVotes : 0),
      qualifiedClicks: b.organicQualifiedClicks ?? (isSeedDataEnabled() ? b.totalQualifiedClicks : 0),
      favorites: b.organicFavorites ?? (isSeedDataEnabled() ? b.totalFavorites : 0),
      views: b.organicViews ?? (isSeedDataEnabled() ? b.totalViews : 0),
      ageHours: Math.max(2, (Date.now() - new Date(b.launchDate).getTime()) / 3_600_000),
    });
    return bScore - aScore;
  });
}

export async function getTrendingProducts() {
  const products = await listPublishedProducts();
  const db = getAdminDb();
  if (!db) return rankTrending(products);
  try {
    const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
    const snapshot = await db.collection("productDailyStats").where("date", ">=", cutoff).limit(5_000).get();
    const daily = new Map<string, Array<{ date: string; votes: number; clicks: number; favorites: number; views: number }>>();
    for (const document of snapshot.docs) {
      const data = document.data() as StoreRecord;
      const date = typeof data.date === "string" ? data.date : asIso(data.date, "").slice(0, 10);
      const productId = typeof data.productId === "string" ? data.productId : "";
      if (!productId || !date) continue;
      const organic = (name: string, legacy: string) => {
        const value = data[name];
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (name === "organicQualifiedClicks") return 0;
        return data.campaignId ? 0 : typeof data[legacy] === "number" && Number.isFinite(data[legacy]) ? data[legacy] as number : 0;
      };
      const row = { date, votes: organic("organicVotes", "votes"), clicks: organic("organicQualifiedClicks", "qualifiedClicks"), favorites: organic("organicFavorites", "favorites"), views: organic("organicViews", "views") };
      daily.set(productId, [...(daily.get(productId) ?? []), row]);
    }
    const today = new Date();
    const recentCutoff = new Date(today.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
    const previousCutoff = new Date(today.getTime() - 14 * 86_400_000).toISOString().slice(0, 10);
    const scoreFor = (product: Product) => {
      const rows = daily.get(product.id) ?? [];
      const recent = rows.filter((row) => row.date >= recentCutoff);
      const previous = rows.filter((row) => row.date >= previousCutoff && row.date < recentCutoff);
      const sum = (values: typeof rows) => values.reduce((totals, row) => ({ votes: totals.votes + row.votes, clicks: totals.clicks + row.clicks, favorites: totals.favorites + row.favorites, views: totals.views + row.views }), { votes: 0, clicks: 0, favorites: 0, views: 0 });
      const current = sum(recent);
      const prior = sum(previous);
      const hasDailyData = rows.length > 0;
      const signals = hasDailyData ? current : { votes: product.organicVotes ?? 0, clicks: product.organicQualifiedClicks ?? 0, favorites: product.organicFavorites ?? 0, views: product.organicViews ?? 0 };
      const ageHours = Math.max(2, (Date.now() - new Date(product.launchDate).getTime()) / 3_600_000);
      const score = calculateTrendingScore({ votes: signals.votes, qualifiedClicks: signals.clicks, favorites: signals.favorites, views: signals.views, ageHours });
      const momentum = current.votes + current.clicks + current.favorites - (prior.votes + prior.clicks + prior.favorites);
      const trend: Product["trend"] = !hasDailyData && product.trend === "new" ? "new" : momentum > 0 ? "up" : momentum < 0 ? "down" : product.trend === "new" ? "new" : "flat";
      return { product: { ...product, trend }, score };
    };
    return products.map(scoreFor).sort((a, b) => b.score - a.score).map(({ product }) => product);
  } catch (error) {
    rememberUnavailable(error);
    return rankTrending(products);
  }
}

export async function getNewProducts() {
  return [...(await listPublishedProducts())].sort((a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime());
}

export async function getMostLovedProducts() {
  return [...(await listPublishedProducts())].sort((a, b) => (b.organicFavorites ?? (isSeedDataEnabled() ? b.totalFavorites : 0)) - (a.organicFavorites ?? (isSeedDataEnabled() ? a.totalFavorites : 0)));
}

export async function getMostClickedProducts() {
  return [...(await listPublishedProducts())].sort((a, b) => (b.organicQualifiedClicks ?? (isSeedDataEnabled() ? b.totalQualifiedClicks : 0)) - (a.organicQualifiedClicks ?? (isSeedDataEnabled() ? a.totalQualifiedClicks : 0)));
}

export async function getMostVotedProducts() {
  return [...(await listPublishedProducts())].sort((a, b) => (b.organicVotes ?? (isSeedDataEnabled() ? b.totalVotes : 0)) - (a.organicVotes ?? (isSeedDataEnabled() ? a.totalVotes : 0)));
}

export async function searchProducts(query: string) {
  const needle = query.trim().toLowerCase();
  const db = getAdminDb();
  if (!db) {
    const products = await listPublishedProducts();
    if (!needle) return products.slice(0, 20);
    return products.filter((product) => `${product.name} ${product.shortDescription} ${product.tags.join(" ")} ${product.makerName} ${product.categoryId}`.toLowerCase().includes(needle));
  }
  try {
    if (!needle) return (await listPublishedProducts(20));
    const tokens = searchTokens(needle).slice(0, 10);
    if (!tokens.length) return [];
    const snapshot = await db.collection("products").where("status", "==", "PUBLISHED").where("searchTerms", "array-contains-any", tokens).limit(100).get();
    const products = snapshot.docs.map((doc) => asProduct(doc.id, doc.data() as StoreRecord));
    return products.filter((product) => {
      const text = `${product.name} ${product.shortDescription} ${product.fullDescription} ${product.tags.join(" ")} ${product.makerName} ${product.categoryId}`.toLowerCase();
      return tokens.every((token) => text.includes(token));
    }).slice(0, 40);
  } catch (error) {
    rememberUnavailable(error);
    const products = await listPublishedProducts();
    return products.filter((product) => {
      const text = `${product.name} ${product.shortDescription} ${product.fullDescription} ${product.tags.join(" ")} ${product.makerName} ${product.categoryId}`.toLowerCase();
      return searchTokens(needle).every((token) => text.includes(token));
    }).slice(0, 40);
  }
}
export async function getCurrentRound(): Promise<LeaderboardRound | undefined> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? getSeedCurrentRound() : undefined;
  try {
    // Keep this query to a single equality filter so it works before the
    // optional leaderboardRounds composite index has been deployed.
    const snapshot = await db.collection("leaderboardRounds").where("status", "==", "ACTIVE").limit(50).get();
    return snapshot.docs
      .map((doc) => asRound(doc.id, doc.data() as StoreRecord))
      .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())[0];
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? getSeedCurrentRound() : undefined;
  }
}

export async function getLeaderboard(round?: LeaderboardRound) {
  const activeRound = round ?? await getCurrentRound();
  if (!activeRound) return [];
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? getSeedLeaderboard() : [];
  try {
    const bidQuery = db.collection("bids").where("roundId", "==", activeRound.id);
    const snapshot = await bidQuery.orderBy("amountCents", "desc").limit(200).get().catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (code !== "9" && code !== "FAILED_PRECONDITION" && !/requires an index/i.test(message)) throw error;
      return bidQuery.limit(200).get();
    });
    const latestByProduct = new Map<string, StoreRecord & { id: string }>();
    for (const doc of snapshot.docs) {
      const data = doc.data() as StoreRecord;
      if (data.status !== "PAID" && data.status !== "ACTIVE") continue;
      const productId = typeof data.productId === "string" ? data.productId : "";
      if (!productId) continue;
      const current = latestByProduct.get(productId);
      if (!current || Number(data.amountCents ?? 0) > Number(current.amountCents ?? 0)) latestByProduct.set(productId, { id: doc.id, ...data });
    }
    const products = await getProductsByIds([...latestByProduct.keys()]);
    const byId = new Map(products.map((product) => [product.id, product]));
    return [...latestByProduct.entries()]
      .map(([productId, bid]) => {
        const product = byId.get(productId);
        return product ? { ...product, bidCents: typeof bid.amountCents === "number" ? bid.amountCents : 0 } : undefined;
      })
      .filter((product): product is Product => Boolean(product))
      .sort((a, b) => b.bidCents - a.bidCents || b.totalVotes - a.totalVotes)
      .slice(0, 10)
      .map((product, index) => ({ ...product, position: index + 1 }));
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function listDailyWinners(limit = 30): Promise<Winner[]> {
  const db = getAdminDb();
  if (!db) return isSeedDataEnabled() ? seedWinnerHistory.slice(0, limit) : [];
  try {
    const snapshot = await db.collection("dailyWinners").limit(limit).get();
    return snapshot.docs
      .map((doc) => asWinner(doc.id, doc.data() as StoreRecord))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    rememberUnavailable(error);
    return isSeedDataEnabled() ? seedWinnerHistory.slice(0, limit) : [];
  }
}

export async function listProductsByIds(ids: string[]) {
  return getProductsByIds(ids);
}

export async function findWinnerByDate(date: string) {
  const winners = await listDailyWinners(90);
  return winners.find((winner) => winner.date === date || winner.id === date);
}

export async function listActiveDeals() {
  const db = getAdminDb();
  if (!db) return [] as Deal[];
  try {
    const snapshot = await db.collection("deals").where("status", "==", "ACTIVE").limit(24).get();
    const now = Date.now();
    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as StoreRecord;
        return {
          id: doc.id,
          productId: String(data.productId ?? ""),
          title: String(data.title ?? "Maker offer"),
          description: String(data.description ?? ""),
          terms: String(data.terms ?? ""),
          couponCode: typeof data.couponCode === "string" ? data.couponCode : undefined,
          destinationUrl: typeof data.destinationUrl === "string" ? data.destinationUrl : undefined,
          startsAt: data.startsAt ? asIso(data.startsAt, "") : undefined,
          expiresAt: data.expiresAt ? asIso(data.expiresAt, "") : undefined,
          status: "ACTIVE" as const,
          createdAt: data.createdAt ? asIso(data.createdAt, "") : undefined,
          updatedAt: data.updatedAt ? asIso(data.updatedAt, "") : undefined,
        } satisfies Deal;
      })
      .filter((deal) => (!deal.startsAt || new Date(deal.startsAt).getTime() <= now) && (!deal.expiresAt || new Date(deal.expiresAt).getTime() >= now));
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}
