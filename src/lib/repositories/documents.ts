import type {
  ActivityEvent,
  AppUser,
  AppUserRole,
  BrawlBounty,
  BrawlSeason,
  Campaign,
  CampaignStatus,
  Category,
  Deal,
  DailyPick,
  LeaderboardRound,
  Notification,
  PlatformRecords,
  PricingType,
  Product,
  ProductLaunchMetadata,
  ProductSocialLinks,
  ProductCompetitiveStats,
  ProductStatus,
  ProductTrend,
  SeasonProductStats,
  UserGamification,
  Winner,
} from "@/lib/types";
import { calculateWinRate, getLeagueDivision, getLevelForXp } from "@/lib/server/gamification";
import { isBlockedHost } from "@/lib/server/website-metadata";

export type StoreRecord = Record<string, unknown>;

export function asDateValue(value: unknown) {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return null;
}

export function asIso(value: unknown, fallback: string) {
  const date = asDateValue(value);
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : fallback;
}

export function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asPublicUrl(value: unknown) {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password || isBlockedHost(url.hostname)) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

export function emptyProductStats(productId = ""): ProductCompetitiveStats {
  return {
    productId,
    rating: 1000,
    totalBrawls: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    currentWinStreak: 0,
    longestWinStreak: 0,
    currentLossStreak: 0,
    longestLossStreak: 0,
    upsetWins: 0,
    closeWins: 0,
    bossWins: 0,
    bossDefenses: 0,
    seasonWins: 0,
    productXp: 0,
    productLevel: 1,
    productLevelTitle: "Rookie",
    division: "BRONZE",
    seasonPoints: 0,
    seasonRank: 0,
    provisionalBrawls: 0,
    isBoss: false,
  };
}

export function asProduct(id: string, data: StoreRecord): Product {
  const name = asString(data.name, "Untitled");
  const launchMetadata = data.launchMetadata && typeof data.launchMetadata === "object" ? data.launchMetadata as StoreRecord : undefined;
  return {
    id,
    slug: asString(data.slug, id),
    ownerId: asString(data.ownerId),
    name,
    shortDescription: asString(data.shortDescription),
    fullDescription: asString(data.fullDescription),
    websiteUrl: asPublicUrl(data.websiteUrl) ?? "",
    logoUrl: asPublicUrl(data.logoUrl),
    coverImageUrl: asPublicUrl(data.coverImageUrl),
    socialLinks: data.socialLinks && typeof data.socialLinks === "object" ? Object.fromEntries(Object.entries(data.socialLinks as StoreRecord).map(([key, value]) => [key, asPublicUrl(value)]).filter(([, value]) => value)) as ProductSocialLinks : undefined,
    launchMetadata: launchMetadata ? {
      tagline: asString(launchMetadata.tagline) || undefined,
      eventType: ["LAUNCH", "DEMO", "WEBINAR", "RELEASE"].includes(asString(launchMetadata.eventType)) ? asString(launchMetadata.eventType) as ProductLaunchMetadata["eventType"] : undefined,
      eventAt: asString(launchMetadata.eventAt) || undefined,
      eventUrl: asPublicUrl(launchMetadata.eventUrl),
    } : undefined,
    makerIds: Array.isArray(data.makerIds) ? data.makerIds.map(String) : undefined,
    ownershipStatus: data.ownershipStatus === "VERIFIED" || data.ownershipStatus === "PENDING" ? data.ownershipStatus : "UNCLAIMED",
    categoryId: asString(data.categoryId, "saas"),
    pricingType: (data.pricingType ?? "Free") as PricingType,
    status: (data.status ?? "PENDING") as ProductStatus,
    launchDate: asIso(data.launchDate, new Date().toISOString()).slice(0, 10),
    makerName: asString(data.makerName),
    makerAvatarUrl: asPublicUrl(data.makerAvatarUrl),
    verified: asBoolean(data.verified),
    featured: asBoolean(data.featured),
    totalVotes: asNumber(data.totalVotes),
    totalClicks: asNumber(data.totalClicks),
    totalQualifiedClicks: asNumber(data.totalQualifiedClicks),
    totalViews: asNumber(data.totalViews),
    totalFavorites: asNumber(data.totalFavorites),
    organicVotes: asNumber(data.organicVotes, asNumber(data.totalVotes)),
    // Legacy qualified-click totals are not safe to treat as organic because
    // older campaign events did not always carry an attribution class.
    organicQualifiedClicks: asNumber(data.organicQualifiedClicks),
    organicViews: asNumber(data.organicViews, asNumber(data.totalViews)),
    organicFavorites: asNumber(data.organicFavorites, asNumber(data.totalFavorites)),
    paidQualifiedClicks: asNumber(data.paidQualifiedClicks),
    paidImpressions: asNumber(data.paidImpressions),
    bidCents: asNumber(data.bidCents),
    position: asNumber(data.position),
    previousPosition: typeof data.previousPosition === "number" ? data.previousPosition : undefined,
    trend: data.trend === "up" || data.trend === "down" || data.trend === "flat" || data.trend === "new" ? (data.trend as ProductTrend) : "new",
    color: asString(data.color, "#FF7058"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    makerCount: asNumber(data.makerCount, 1),
  };
}

export function asCategory(id: string, data: StoreRecord): Category {
  return {
    id,
    slug: asString(data.slug, id),
    name: asString(data.name, id),
    description: asString(data.description),
    icon: asString(data.icon, "▣"),
    displayOrder: asNumber(data.displayOrder, 0),
    active: data.active === false ? false : true,
    accent: asString(data.accent, "#7254CA"),
  };
}

export function asCampaign(id: string, data: StoreRecord): Campaign {
  return {
    id,
    bidId: asString(data.bidId, id),
    productId: asString(data.productId),
    productName: asString(data.productName, "Untitled"),
    ownerId: asString(data.ownerId) || undefined,
    status: (data.status ?? "PENDING") as CampaignStatus,
    purchasedAmountCents: asNumber(data.purchasedAmountCents),
    purchasedImpressions: asNumber(data.purchasedImpressions),
    deliveredImpressions: asNumber(data.deliveredImpressions),
    qualifiedImpressions: asNumber(data.qualifiedImpressions),
    remainingImpressions: asNumber(data.remainingImpressions, Math.max(0, asNumber(data.purchasedImpressions) - asNumber(data.qualifiedImpressions))),
    clicks: asNumber(data.clicks),
    qualifiedClicks: asNumber(data.qualifiedClicks),
    startedAt: asIso(data.startedAt, new Date().toISOString()),
    expiresAt: asIso(data.expiresAt, new Date().toISOString()),
  };
}

export function asDeal(id: string, data: StoreRecord): Deal {
  const status = data.status === "ACTIVE" || data.status === "EXPIRED" || data.status === "ARCHIVED" ? data.status : "DRAFT";
  return {
    id,
    productId: asString(data.productId),
    title: asString(data.title, "Maker offer"),
    description: asString(data.description),
    terms: asString(data.terms),
    couponCode: asString(data.couponCode) || undefined,
    destinationUrl: asString(data.destinationUrl) || undefined,
    startsAt: data.startsAt ? asIso(data.startsAt, "") : undefined,
    expiresAt: data.expiresAt ? asIso(data.expiresAt, "") : undefined,
    status,
    createdAt: data.createdAt ? asIso(data.createdAt, "") : undefined,
    updatedAt: data.updatedAt ? asIso(data.updatedAt, "") : undefined,
  };
}

export function asBounty(id: string, data: StoreRecord): BrawlBounty {
  const type = data.type === "BREAK_STREAK" || data.type === "GIANT_KILLER" ? data.type : "DEFEAT_BOSS";
  const status = data.status === "COMPLETED" || data.status === "EXPIRED" ? data.status : "ACTIVE";
  return {
    id,
    type,
    title: asString(data.title, "Brawl bounty"),
    description: asString(data.description),
    targetProductId: asString(data.targetProductId) || undefined,
    categoryId: asString(data.categoryId) || undefined,
    requirements: data.requirements && typeof data.requirements === "object" ? data.requirements as Record<string, number | string> : {},
    xpReward: asNumber(data.xpReward),
    achievementId: asString(data.achievementId) || undefined,
    status,
    startsAt: asIso(data.startsAt, new Date().toISOString()),
    endsAt: asIso(data.endsAt, new Date().toISOString()),
    completedByProductId: asString(data.completedByProductId) || undefined,
    completedBrawlId: asString(data.completedBrawlId) || undefined,
  };
}

export function asNotification(id: string, data: StoreRecord): Notification {
  const createdAt = asIso(data.createdAt ?? data.timestamp, new Date().toISOString());
  const tone = data.tone === "coral" || data.tone === "blue" || data.tone === "green" || data.tone === "neutral" ? data.tone : "neutral";
  return {
    id,
    userId: asString(data.userId) || undefined,
    entityId: asString(data.entityId) || undefined,
    title: asString(data.title, "Update"),
    body: asString(data.body),
    timestamp: createdAt,
    read: asBoolean(data.read),
    tone,
    type: asString(data.type) || undefined,
    href: asString(data.href) || undefined,
    emailStatus: data.emailStatus === "SENT" || data.emailStatus === "FAILED" || data.emailStatus === "SKIPPED" ? data.emailStatus : data.emailStatus === "PENDING" ? "PENDING" : undefined,
  };
}

export function asWinner(id: string, data: StoreRecord): Winner {
  return {
    id,
    date: asString(data.date, asIso(data.createdAt, new Date().toISOString()).slice(0, 10)),
    productId: asString(data.productId),
    productName: asString(data.productName),
    productSlug: asString(data.productSlug),
    winningBidCents: asNumber(data.winningBidCents),
    views: asNumber(data.views),
    clicks: asNumber(data.clicks),
    category: asString(data.category),
    makerName: asString(data.makerName),
  };
}

export function asRound(id: string, data: StoreRecord): LeaderboardRound {
  return {
    id,
    startsAt: asIso(data.startsAt, new Date().toISOString()),
    endsAt: asIso(data.endsAt, new Date().toISOString()),
    status: data.status === "UPCOMING" || data.status === "ACTIVE" || data.status === "FINALIZING" || data.status === "COMPLETED" ? data.status : "ACTIVE",
    totalRevenueCents: asNumber(data.totalRevenueCents),
    winningProductId: asString(data.winningProductId) || undefined,
    winningBidCents: typeof data.winningBidCents === "number" ? data.winningBidCents : undefined,
  };
}

export function asUser(id: string, data: StoreRecord, fallback?: Partial<AppUser>): AppUser {
  const role = data.role === "ADMIN" || data.role === "MODERATOR" || fallback?.role === "ADMIN" ? (data.role === "MODERATOR" ? "MODERATOR" : "ADMIN") : "USER";
  return {
    id,
    clerkUserId: asString(data.clerkUserId, fallback?.clerkUserId ?? id),
    displayName: asString(data.displayName, fallback?.displayName ?? "Maker"),
    username: asString(data.username, fallback?.username ?? id),
    email: asString(data.email, fallback?.email ?? ""),
    imageUrl: asPublicUrl(data.imageUrl) ?? fallback?.imageUrl,
    website: asPublicUrl(data.website) ?? fallback?.website,
    bio: typeof data.bio === "string" ? data.bio : fallback?.bio,
    notificationPreferences: data.notificationPreferences && typeof data.notificationPreferences === "object" ? {
      email: (data.notificationPreferences as StoreRecord).email !== false,
      productActivity: (data.notificationPreferences as StoreRecord).productActivity !== false,
      competitive: (data.notificationPreferences as StoreRecord).competitive !== false,
      campaigns: (data.notificationPreferences as StoreRecord).campaigns !== false,
    } : fallback?.notificationPreferences,
    emailDeliveryState: data.emailDeliveryState === "ACTIVE" || data.emailDeliveryState === "BOUNCED" || data.emailDeliveryState === "UNSUBSCRIBED" ? data.emailDeliveryState : fallback?.emailDeliveryState ?? "UNKNOWN",
    role: role as AppUserRole,
  };
}

export function asCompetitiveStats(productId: string, data: StoreRecord): ProductCompetitiveStats {
  const wins = asNumber(data.wins);
  const losses = asNumber(data.losses);
  const draws = asNumber(data.draws);
  const productXp = asNumber(data.productXp);
  const level = getLevelForXp(productXp, true);
  const rating = asNumber(data.rating, 1000);
  return {
    ...emptyProductStats(productId),
    rating,
    totalBrawls: asNumber(data.totalBrawls),
    wins,
    losses,
    draws,
    winRate: calculateWinRate(wins, losses, draws),
    currentWinStreak: asNumber(data.currentWinStreak),
    longestWinStreak: asNumber(data.longestWinStreak),
    currentLossStreak: asNumber(data.currentLossStreak),
    longestLossStreak: asNumber(data.longestLossStreak),
    upsetWins: asNumber(data.upsetWins),
    closeWins: asNumber(data.closeWins),
    bossWins: asNumber(data.bossWins),
    bossDefenses: asNumber(data.bossDefenses),
    seasonWins: asNumber(data.seasonWins),
    productXp,
    productLevel: asNumber(data.productLevel, level.level),
    productLevelTitle: asString(data.productLevelTitle, level.title),
    division: ["BRONZE", "SILVER", "GOLD", "DIAMOND"].includes(asString(data.division)) ? (data.division as ProductCompetitiveStats["division"]) : getLeagueDivision(rating),
    seasonPoints: asNumber(data.seasonPoints),
    seasonRank: asNumber(data.seasonRank),
    provisionalBrawls: asNumber(data.provisionalBrawls),
    isBoss: asBoolean(data.isBoss),
  };
}

export function asSeason(id: string, data: StoreRecord): BrawlSeason {
  return {
    id,
    name: asString(data.name, "Season"),
    slug: asString(data.slug, id),
    startsAt: asIso(data.startsAt, new Date().toISOString()),
    endsAt: asIso(data.endsAt, new Date().toISOString()),
    status: data.status === "UPCOMING" || data.status === "ACTIVE" || data.status === "FINALIZING" || data.status === "COMPLETED" ? data.status : "ACTIVE",
    current: asBoolean(data.current),
    finalizedAt: data.finalizedAt ? asIso(data.finalizedAt, new Date().toISOString()) : undefined,
    championProductId: asString(data.championProductId) || undefined,
    categoryChampions: data.categoryChampions && typeof data.categoryChampions === "object" ? (data.categoryChampions as Record<string, string>) : undefined,
    createdAt: asIso(data.createdAt, new Date().toISOString()),
  };
}

export function asSeasonStats(id: string, data: StoreRecord): SeasonProductStats {
  return {
    id,
    seasonId: asString(data.seasonId),
    productId: asString(data.productId),
    categoryId: asString(data.categoryId),
    ratingStart: asNumber(data.ratingStart, 1000),
    ratingCurrent: asNumber(data.ratingCurrent, 1000),
    points: asNumber(data.points),
    wins: asNumber(data.wins),
    losses: asNumber(data.losses),
    draws: asNumber(data.draws),
    bossWins: asNumber(data.bossWins),
    upsetWins: asNumber(data.upsetWins),
    rank: asNumber(data.rank),
    division: ["BRONZE", "SILVER", "GOLD", "DIAMOND"].includes(asString(data.division)) ? (data.division as SeasonProductStats["division"]) : "BRONZE",
    movement: asNumber(data.movement),
    provisional: asBoolean(data.provisional),
  };
}

export function asUserGamification(userId: string, data: StoreRecord): UserGamification {
  const xp = asNumber(data.xp);
  const level = getLevelForXp(xp);
  const totalPredictions = asNumber(data.totalPredictions);
  const correctPredictions = asNumber(data.correctPredictions);
  return {
    userId,
    xp,
    level: asNumber(data.level, level.level),
    levelTitle: asString(data.levelTitle, level.title),
    tastemakerScore: asNumber(data.tastemakerScore),
    earlyFinds: asNumber(data.earlyFinds),
    totalPredictions,
    correctPredictions,
    predictionAccuracy: totalPredictions > 0 ? Number(((correctPredictions / totalPredictions) * 100).toFixed(1)) : 0,
    currentPredictionStreak: asNumber(data.currentPredictionStreak),
    bestPredictionStreak: asNumber(data.bestPredictionStreak),
    questsCompleted: asNumber(data.questsCompleted),
    dailyPicksPlayed: asNumber(data.dailyPicksPlayed),
    dailyPickWins: asNumber(data.dailyPickWins),
    updatedAt: asIso(data.updatedAt, new Date().toISOString()),
  };
}

export function emptyUserGamification(userId: string): UserGamification {
  return asUserGamification(userId, {});
}

export function asDailyPick(id: string, data: StoreRecord): DailyPick {
  return {
    id,
    date: asString(data.date),
    userId: asString(data.userId),
    productIds: Array.isArray(data.productIds) ? data.productIds.map(String) : [],
    submittedAt: asIso(data.submittedAt, new Date().toISOString()),
    score: typeof data.score === "number" ? data.score : undefined,
    rank: typeof data.rank === "number" ? data.rank : undefined,
  };
}

export function asActivity(id: string, data: StoreRecord): ActivityEvent {
  return {
    id,
    type: asString(data.type, "EVENT"),
    entityType: data.entityType === "BRAWL" || data.entityType === "PRODUCT" || data.entityType === "USER" || data.entityType === "SEASON" || data.entityType === "LEAGUE" ? data.entityType : "PRODUCT",
    entityId: asString(data.entityId, id),
    productId: asString(data.productId) || undefined,
    userId: asString(data.userId) || undefined,
    metadata: data.metadata && typeof data.metadata === "object" ? (data.metadata as ActivityEvent["metadata"]) : {},
    visibility: data.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    createdAt: asIso(data.createdAt, new Date().toISOString()),
  };
}

export function asPlatformRecords(data: StoreRecord): PlatformRecords {
  const record = (value: unknown) => {
    if (!value || typeof value !== "object") return undefined;
    const item = value as { productId?: string; userId?: string; brawlId?: string; value?: number };
    if (typeof item.value !== "number") return undefined;
    return item;
  };
  return {
    mostBrawlWins: record(data.mostBrawlWins) as PlatformRecords["mostBrawlWins"],
    longestWinStreak: record(data.longestWinStreak) as PlatformRecords["longestWinStreak"],
    highestRating: record(data.highestRating) as PlatformRecords["highestRating"],
    mostBossDefenses: record(data.mostBossDefenses) as PlatformRecords["mostBossDefenses"],
    biggestUpset: record(data.biggestUpset) as PlatformRecords["biggestUpset"],
    closestBrawl: record(data.closestBrawl) as PlatformRecords["closestBrawl"],
    mostVotedBrawl: record(data.mostVotedBrawl) as PlatformRecords["mostVotedBrawl"],
    topTastemaker: record(data.topTastemaker) as PlatformRecords["topTastemaker"],
    mostSeasonTitles: record(data.mostSeasonTitles) as PlatformRecords["mostSeasonTitles"],
    mostBossSlays: record(data.mostBossSlays) as PlatformRecords["mostBossSlays"],
    bestPredictionStreak: record(data.bestPredictionStreak) as PlatformRecords["bestPredictionStreak"],
  };
}

export function searchTokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .slice(0, 24);
}
