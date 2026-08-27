import { z } from "zod";
import { isBlockedHost } from "@/lib/server/website-metadata";

const publicHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password && !isBlockedHost(url.hostname);
  } catch {
    return false;
  }
};

export const optionalPublicHttpUrl = z.string().url().max(500).refine(publicHttpUrl, "Only public http and https URLs are allowed.").optional();
const socialLinksSchema = z.object({
  x: optionalPublicHttpUrl,
  github: optionalPublicHttpUrl,
  linkedin: optionalPublicHttpUrl,
  discord: optionalPublicHttpUrl,
  youtube: optionalPublicHttpUrl,
}).partial().optional();
const launchMetadataSchema = z.object({
  tagline: z.string().trim().max(180).optional(),
  eventType: z.enum(["LAUNCH", "DEMO", "WEBINAR", "RELEASE"]).optional(),
  eventAt: z.string().trim().max(80).refine((value) => !value || !Number.isNaN(Date.parse(value)), "Enter a valid event date.").optional(),
  eventUrl: optionalPublicHttpUrl,
}).partial().optional();

export const voteSchema = z.object({ productId: z.string().min(1).max(100) });
export const favoriteSchema = z.object({ productId: z.string().min(1).max(100) });
export const brawlVoteSchema = z.object({ brawlId: z.string().min(1).max(120), selectedProductId: z.string().min(1).max(120) });
export const brawlPredictionSchema = z.object({ brawlId: z.string().min(1).max(120), predictedProductId: z.string().min(1).max(120) });
export const brawlChallengeSchema = z.object({ challengerProductId: z.string().min(1).max(120), challengedProductId: z.string().min(1).max(120), message: z.string().trim().max(280).optional() });
export const challengeResponseSchema = z.object({ action: z.enum(["ACCEPT", "DECLINE"]) });
export const rematchSchema = z.object({ message: z.string().trim().max(280).optional() });
export const rematchResponseSchema = z.object({ action: z.enum(["ACCEPT", "DECLINE"]) });
export const dailyPicksSchema = z.object({ productIds: z.array(z.string().min(1).max(120)).length(3) });
export const impressionSchema = z.object({ campaignId: z.string().min(1).max(100), productId: z.string().min(1).max(100), placement: z.string().regex(/^[a-z0-9][a-z0-9_-]{1,79}$/), page: z.string().min(1).max(200), sessionId: z.string().min(8).max(120), trackingToken: z.string().min(20).max(300) });
export const viewSchema = z.object({ productId: z.string().min(1).max(100), sessionId: z.string().min(8).max(120) });
export const clickSchema = z.object({ productId: z.string().min(1).max(100), campaignId: z.string().max(100).optional(), placement: z.string().regex(/^[a-z0-9][a-z0-9_-]{1,79}$/).optional(), page: z.string().max(200).optional(), source: z.string().max(120).optional(), sessionId: z.string().max(120).optional(), trackingToken: z.string().min(20).max(300).optional() });
export const bidSchema = z.object({ productId: z.string().min(1).max(100), amountCents: z.number().int().positive().max(10_000_000), roundId: z.string().min(1).max(100) });
export const submitProductSchema = z.object({
  name: z.string().min(2).max(80),
  websiteUrl: z.string().url().max(300).refine(publicHttpUrl, "Only public http and https URLs are allowed."),
  shortDescription: z.string().min(10).max(180),
  fullDescription: z.string().min(20).max(4000),
  categoryId: z.string().min(1).max(80),
  pricingType: z.enum(["Free", "Freemium", "Paid", "Open source"]),
  logoUrl: z.string().url().max(500).refine(publicHttpUrl, "Only public http and https logo URLs are allowed.").optional(),
  coverImageUrl: optionalPublicHttpUrl,
  launchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Launch date must be YYYY-MM-DD.").optional(),
  socialLinks: socialLinksSchema,
  launchMetadata: launchMetadataSchema,
  makerIds: z.array(z.string().min(1).max(120)).max(20).optional(),
});
export const updateProductSchema = submitProductSchema.partial().refine((value) => Object.keys(value).length > 0, "At least one product field is required.");
export const websitePreviewSchema = z.object({ url: z.string().trim().min(3).max(300) });

const draftUrl = z.union([z.literal(""), optionalPublicHttpUrl]);
export const productDraftSchema = z.object({
  websiteUrl: draftUrl.optional(),
  name: z.string().max(80).optional(),
  shortDescription: z.string().max(180).optional(),
  fullDescription: z.string().max(4000).optional(),
  categoryId: z.string().max(80).optional(),
  pricingType: z.enum(["Free", "Freemium", "Paid", "Open source"]).optional(),
  logoUrl: draftUrl.optional(),
  coverImageUrl: draftUrl.optional(),
  launchDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  launchTagline: z.string().max(180).optional(),
  launchEventType: z.enum(["", "LAUNCH", "DEMO", "WEBINAR", "RELEASE"]).optional(),
  launchEventAt: z.string().max(80).optional(),
  launchEventUrl: draftUrl,
  launchMetadata: launchMetadataSchema,
  socialLinks: z.object({
    x: draftUrl.optional(),
    github: draftUrl.optional(),
    linkedin: draftUrl.optional(),
    discord: draftUrl.optional(),
    youtube: draftUrl.optional(),
  }).partial().optional(),
}).strict();
