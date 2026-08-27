import { disableAdminDb, getAdminDb, isFirestoreUnavailableError } from "@/lib/firebase/admin";
import type { FeatureFlags } from "@/lib/types";

export const defaultPlatformSettings = {
  currency: "usd",
  minimumBidCents: 100,
  minimumIncrementCents: 100,
  maximumBidCents: 2_900_000,
  promoImpressionsPerDollar: 20,
  impressionDwellMs: 1000,
  impressionVisibleRatio: 0.5,
  impressionCooldownMs: 6 * 60 * 60 * 1000,
  gamificationConfigVersion: 1,
  biddingConfigVersion: 1,
  biddingPaused: false,
  newCampaignsPaused: false,
  maintenanceMode: false,
  maintenanceMessage: "We are applying a short maintenance window. Please try again soon.",
};

export const defaultFeatureFlags: FeatureFlags = {
  submissionsEnabled: true,
  votingEnabled: true,
  biddingEnabled: false,
  campaignDeliveryEnabled: false,
  brawlsEnabled: true,
  challengesEnabled: true,
  predictionsEnabled: true,
  questsEnabled: true,
  dailyPicksEnabled: true,
  leaguesEnabled: true,
  bossBrawlsEnabled: true,
  bountiesEnabled: true,
};

export const productionDefaultFeatureFlags: FeatureFlags = {
  submissionsEnabled: false,
  votingEnabled: false,
  biddingEnabled: false,
  campaignDeliveryEnabled: false,
  brawlsEnabled: false,
  challengesEnabled: false,
  predictionsEnabled: false,
  questsEnabled: false,
  dailyPicksEnabled: false,
  leaguesEnabled: false,
  bossBrawlsEnabled: false,
  bountiesEnabled: false,
};

export type PlatformSettings = typeof defaultPlatformSettings & { featureFlags: FeatureFlags };

export type FeatureFlagKey = keyof FeatureFlags;

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const db = getAdminDb();
  const baselineFlags = process.env.NODE_ENV === "production" ? productionDefaultFeatureFlags : defaultFeatureFlags;
  if (!db) return { ...defaultPlatformSettings, featureFlags: baselineFlags };
  try {
    const snapshot = await db.collection("settings").doc("platform").get();
    const data = snapshot.data() ?? {};
    const flagsSnap = await db.collection("settings").doc("gamification").get();
    const flags = flagsSnap.data()?.featureFlags ?? {};
    return {
      currency: typeof data.currency === "string" ? data.currency : defaultPlatformSettings.currency,
      minimumBidCents: typeof data.minimumBidCents === "number" ? data.minimumBidCents : defaultPlatformSettings.minimumBidCents,
      minimumIncrementCents: typeof data.minimumIncrementCents === "number" ? data.minimumIncrementCents : defaultPlatformSettings.minimumIncrementCents,
      maximumBidCents: typeof data.maximumBidCents === "number" ? Math.max(data.maximumBidCents, defaultPlatformSettings.maximumBidCents) : defaultPlatformSettings.maximumBidCents,
      promoImpressionsPerDollar: typeof data.promoImpressionsPerDollar === "number" ? data.promoImpressionsPerDollar : defaultPlatformSettings.promoImpressionsPerDollar,
      impressionDwellMs: typeof data.impressionDwellMs === "number" ? data.impressionDwellMs : defaultPlatformSettings.impressionDwellMs,
      impressionVisibleRatio: typeof data.impressionVisibleRatio === "number" ? data.impressionVisibleRatio : defaultPlatformSettings.impressionVisibleRatio,
      impressionCooldownMs: typeof data.impressionCooldownMs === "number" ? data.impressionCooldownMs : defaultPlatformSettings.impressionCooldownMs,
      gamificationConfigVersion: typeof data.gamificationConfigVersion === "number" && data.gamificationConfigVersion > 0 ? Math.floor(data.gamificationConfigVersion) : defaultPlatformSettings.gamificationConfigVersion,
      biddingConfigVersion: typeof data.biddingConfigVersion === "number" && data.biddingConfigVersion > 0 ? Math.floor(data.biddingConfigVersion) : defaultPlatformSettings.biddingConfigVersion,
      biddingPaused: Boolean(data.biddingPaused),
      newCampaignsPaused: Boolean(data.newCampaignsPaused),
      maintenanceMode: Boolean(data.maintenanceMode),
      maintenanceMessage: typeof data.maintenanceMessage === "string" && data.maintenanceMessage.trim() ? data.maintenanceMessage : defaultPlatformSettings.maintenanceMessage,
      featureFlags: { ...baselineFlags, ...flags },
    };
  } catch (error) {
    if (isFirestoreUnavailableError(error)) disableAdminDb();
    return { ...defaultPlatformSettings, featureFlags: baselineFlags };
  }
}

export async function isFeatureEnabled(flag: FeatureFlagKey) {
  const settings = await getPlatformSettings();
  return settings.featureFlags[flag];
}

export async function isMaintenanceMode() {
  return (await getPlatformSettings()).maintenanceMode;
}
