export type ProductStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export type PricingType = "Free" | "Freemium" | "Paid" | "Open source";
export type CampaignStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "PAUSED" | "EXPIRED" | "REFUNDED";
export type ProductTrend = "up" | "down" | "new" | "flat";
export type BrawlStatus = "SCHEDULED" | "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";
export type BrawlResult = "A_WIN" | "B_WIN" | "DRAW";
export type AchievementRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type ChallengeStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
export type SeasonStatus = "UPCOMING" | "ACTIVE" | "FINALIZING" | "COMPLETED";
export type LeagueDivision = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";
export type AppUserRole = "USER" | "MODERATOR" | "ADMIN";
export type ProductSocialLinks = Partial<Record<"x" | "github" | "linkedin" | "discord" | "youtube", string>>;
export type ProductLaunchMetadata = {
  tagline?: string;
  eventType?: "LAUNCH" | "DEMO" | "WEBINAR" | "RELEASE";
  eventAt?: string;
  eventUrl?: string;
};
export type ProductLaunchEvent = ProductLaunchMetadata & {
  id: string;
  productId: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED";
  createdAt?: string;
  updatedAt?: string;
};

export type AppUser = {
  id: string;
  clerkUserId: string;
  displayName: string;
  username: string;
  email: string;
  imageUrl?: string;
  website?: string;
  bio?: string;
  notificationPreferences?: { email: boolean; productActivity: boolean; competitive: boolean; campaigns: boolean };
  emailDeliveryState?: "ACTIVE" | "BOUNCED" | "UNSUBSCRIBED" | "UNKNOWN";
  role: AppUserRole;
};

export type Product = {
  id: string;
  slug: string;
  ownerId: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  websiteUrl: string;
  logoUrl?: string;
  coverImageUrl?: string;
  socialLinks?: ProductSocialLinks;
  launchMetadata?: ProductLaunchMetadata;
  makerIds?: string[];
  ownershipStatus?: "UNCLAIMED" | "PENDING" | "VERIFIED";
  categoryId: string;
  pricingType: PricingType;
  status: ProductStatus;
  launchDate: string;
  makerName: string;
  makerAvatarUrl?: string;
  verified: boolean;
  featured: boolean;
  totalVotes: number;
  totalClicks: number;
  totalQualifiedClicks: number;
  totalViews: number;
  totalFavorites: number;
  organicVotes?: number;
  organicQualifiedClicks?: number;
  organicViews?: number;
  organicFavorites?: number;
  paidQualifiedClicks?: number;
  paidImpressions?: number;
  bidCents: number;
  position: number;
  previousPosition?: number;
  trend: ProductTrend;
  color: string;
  tags: string[];
  makerCount?: number;
  brawlStats?: ProductCompetitiveStats;
};

export type ProductMember = {
  id: string;
  productId: string;
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER" | "INVITED";
  status: "ACTIVE" | "PENDING" | "REMOVED";
  invitedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductCompetitiveStats = {
  productId?: string;
  rating: number;
  totalBrawls: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentWinStreak: number;
  longestWinStreak: number;
  currentLossStreak: number;
  longestLossStreak: number;
  upsetWins: number;
  closeWins: number;
  bossWins: number;
  bossDefenses: number;
  seasonWins: number;
  productXp: number;
  productLevel: number;
  productLevelTitle: string;
  division: LeagueDivision;
  seasonPoints: number;
  seasonRank: number;
  provisionalBrawls: number;
  isBoss: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  active: boolean;
  accent: string;
};

export type LeaderboardRound = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "UPCOMING" | "ACTIVE" | "FINALIZING" | "COMPLETED";
  totalRevenueCents: number;
  winningProductId?: string;
  winningBidCents?: number;
};

export type Winner = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  productSlug: string;
  winningBidCents: number;
  views: number;
  clicks: number;
  category: string;
  makerName: string;
};

export type Brawl = {
  id: string;
  prompt: string;
  leftProductId: string;
  rightProductId: string;
  leftVotes: number;
  rightVotes: number;
  endsAt: string;
  status: BrawlStatus;
  productAId?: string;
  productBId?: string;
  categoryId?: string;
  startsAt?: string;
  totalVotes?: number;
  winnerProductId?: string;
  loserProductId?: string;
  draw?: boolean;
  productARatingBefore?: number;
  productBRatingBefore?: number;
  productARatingAfter?: number;
  productBRatingAfter?: number;
  productARatingDelta?: number;
  productBRatingDelta?: number;
  productAWinProbabilityBefore?: number;
  productBWinProbabilityBefore?: number;
  leadChanges?: number;
  largestLeadProductId?: string;
  largestLeadPercent?: number;
  closestMarginPercent?: number;
  finalMarginPercent?: number;
  upsetScore?: number;
  wasUpset?: boolean;
  wasCloseBrawl?: boolean;
  challengerProductId?: string;
  challengedProductId?: string;
  challengeId?: string;
  rematchOfBrawlId?: string;
  bossBrawl?: boolean;
  bossProductId?: string;
  seasonId?: string;
  createdBy?: string;
  finalizedAt?: string;
  finalizationVersion?: number;
  currentLeaderProductId?: string;
  momentum?: MomentumSnapshot;
};

export type MomentumSnapshot = {
  leftVotes: number;
  rightVotes: number;
  leftPercent: number;
  rightPercent: number;
  label: string;
  windowMinutes: number;
};

export type BrawlVote = {
  id: string;
  brawlId: string;
  userId: string;
  selectedProductId: string;
  createdAt: string;
};

export type BrawlPrediction = {
  id: string;
  brawlId: string;
  userId: string;
  predictedProductId: string;
  createdAt: string;
  correct?: boolean;
  voided?: boolean;
  resolvedAt?: string;
};

export type BrawlChallenge = {
  id: string;
  challengerUserId: string;
  challengerProductId: string;
  challengedProductId: string;
  challengedOwnerId: string;
  message?: string;
  status: ChallengeStatus;
  createdAt: string;
  respondedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  createdBrawlId?: string;
};

export type BrawlReport = {
  brawlId: string;
  winnerProductId?: string;
  loserProductId?: string;
  draw: boolean;
  totalVotes: number;
  productAPercent: number;
  productBPercent: number;
  finalMarginPercent: number;
  leadChanges: number;
  largestLeadProductId?: string;
  largestLeadPercent: number;
  ratingDeltaA: number;
  ratingDeltaB: number;
  highlight: string;
  generatedAt: string;
};

export type RivalrySummary = {
  key: string;
  productAId: string;
  productBId: string;
  meetings: number;
  productAWins: number;
  productBWins: number;
  draws: number;
  leaderProductId?: string;
  latestBrawlId?: string;
  biggestWinBrawlId?: string;
  closestBrawlId?: string;
};

export type BrawlSeason = {
  id: string;
  name: string;
  slug: string;
  startsAt: string;
  endsAt: string;
  status: SeasonStatus;
  current: boolean;
  finalizedAt?: string;
  championProductId?: string;
  categoryChampions?: Record<string, string>;
  createdAt: string;
};

export type SeasonProductStats = {
  id: string;
  seasonId: string;
  productId: string;
  categoryId: string;
  ratingStart: number;
  ratingCurrent: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  bossWins: number;
  upsetWins: number;
  rank: number;
  division: LeagueDivision;
  movement: number;
  provisional: boolean;
};

export type LeagueStanding = SeasonProductStats & { productName: string; winRate: number; streak: number };

export type UserGamification = {
  userId: string;
  xp: number;
  level: number;
  levelTitle: string;
  tastemakerScore: number;
  earlyFinds: number;
  totalPredictions: number;
  correctPredictions: number;
  predictionAccuracy: number;
  currentPredictionStreak: number;
  bestPredictionStreak: number;
  questsCompleted: number;
  dailyPicksPlayed: number;
  dailyPickWins: number;
  updatedAt: string;
};

export type DailyQuest = {
  id: string;
  date: string;
  type: "VOTE_BRAWLS" | "DISCOVER_PRODUCTS" | "PREDICT_BRAWLS" | "VISIT_CATEGORIES" | "DAILY_PICKS";
  title: string;
  description: string;
  target: number;
  xpReward: number;
};

export type DailyQuestTemplate = Omit<DailyQuest, "id" | "date"> & { id: string; active: boolean; version: number };

export type QuestProgress = DailyQuest & { progress: number; completed: boolean; completedAt?: string };

export type DailyPick = {
  id: string;
  date: string;
  userId: string;
  productIds: string[];
  submittedAt: string;
  score?: number;
  rank?: number;
};

export type DailyPickResult = { productId: string; points: number; reason: string };

export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  scope: "PRODUCT" | "USER";
};

export type EarnedAchievement = AchievementDefinition & { earnedAt: string; subjectId: string };

export type BrawlBounty = {
  id: string;
  type: "DEFEAT_BOSS" | "BREAK_STREAK" | "GIANT_KILLER";
  title: string;
  description: string;
  targetProductId?: string;
  categoryId?: string;
  requirements: Record<string, number | string>;
  xpReward: number;
  achievementId?: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  startsAt: string;
  endsAt: string;
  completedByProductId?: string;
  completedBrawlId?: string;
};

export type BossReign = {
  id: string;
  productId: string;
  categoryId: string;
  startedAt: string;
  endedAt?: string;
  defenses: number;
  defeatedByProductId?: string;
  endingBrawlId?: string;
};

export type ActivityEvent = {
  id: string;
  type: string;
  entityType: "BRAWL" | "PRODUCT" | "USER" | "SEASON" | "LEAGUE";
  entityId: string;
  productId?: string;
  userId?: string;
  metadata: Record<string, string | number | boolean>;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
};

export type PlatformRecords = {
  mostBrawlWins?: { productId: string; value: number };
  longestWinStreak?: { productId: string; value: number };
  highestRating?: { productId: string; value: number };
  mostBossDefenses?: { productId: string; value: number };
  biggestUpset?: { brawlId: string; value: number };
  closestBrawl?: { brawlId: string; value: number };
  mostVotedBrawl?: { brawlId: string; value: number };
  topTastemaker?: { userId: string; value: number };
  mostSeasonTitles?: { productId: string; value: number };
  mostBossSlays?: { productId: string; value: number };
  bestPredictionStreak?: { userId: string; value: number };
};

export type FeatureFlags = {
  submissionsEnabled: boolean;
  votingEnabled: boolean;
  biddingEnabled: boolean;
  campaignDeliveryEnabled: boolean;
  brawlsEnabled: boolean;
  challengesEnabled: boolean;
  predictionsEnabled: boolean;
  questsEnabled: boolean;
  dailyPicksEnabled: boolean;
  leaguesEnabled: boolean;
  bossBrawlsEnabled: boolean;
  bountiesEnabled: boolean;
};

export type Campaign = {
  id: string;
  bidId: string;
  productId: string;
  productName: string;
  ownerId?: string;
  status: CampaignStatus;
  purchasedAmountCents: number;
  purchasedImpressions: number;
  deliveredImpressions: number;
  qualifiedImpressions: number;
  remainingImpressions: number;
  clicks: number;
  qualifiedClicks: number;
  startedAt: string;
  expiresAt: string;
};

export type Deal = {
  id: string;
  productId: string;
  title: string;
  description: string;
  terms: string;
  couponCode?: string;
  destinationUrl?: string;
  startsAt?: string;
  expiresAt?: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
  createdAt?: string;
  updatedAt?: string;
};

export type Notification = {
  id: string;
  userId?: string;
  entityId?: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  tone: "coral" | "blue" | "green" | "neutral";
  type?: string;
  href?: string;
  emailStatus?: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
};

export type DiscoveryFilter = "trending" | "new" | "loved" | "clicked" | "voted";
