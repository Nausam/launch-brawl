import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.CAMPAIGN_TRACKING_SECRET || process.env.FREEMIUS_SECRET_KEY || process.env.CLERK_SECRET_KEY || "";
}

function signature(payload: string) {
  const key = secret();
  return key ? createHmac("sha256", key).update(payload).digest("base64url") : "";
}

export function createCampaignTrackingToken({ campaignId, productId, placement, page, expiresAt = Date.now() + 60 * 60 * 1000 }: { campaignId: string; productId: string; placement: string; page: string; expiresAt?: number }) {
  const payload = `${campaignId}|${productId}|${placement}|${page}|${Math.floor(expiresAt)}`;
  const signed = signature(payload);
  return signed ? `${Math.floor(expiresAt)}.${signed}` : "";
}

export function verifyCampaignTrackingToken({ token, campaignId, productId, placement, page, now = Date.now() }: { token: string | undefined; campaignId: string; productId: string; placement: string; page: string; now?: number }) {
  if (!token) return false;
  const separator = token.indexOf(".");
  if (separator <= 0) return false;
  const expiresAt = Number(token.slice(0, separator));
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  const expected = signature(`${campaignId}|${productId}|${placement}|${page}|${expiresAt}`);
  const provided = token.slice(separator + 1);
  if (!expected || expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
