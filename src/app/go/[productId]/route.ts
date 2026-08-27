import { NextResponse } from "next/server";
import { findProductById } from "@/lib/repositories/catalog";
import { recordOutboundClick } from "@/lib/repositories/engagement";
import { isValidOutboundUrl } from "@/lib/utils";
import { clickSchema } from "@/lib/server/schemas";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { assertSafeRemoteHost, normalizeWebsiteUrl } from "@/lib/server/website-metadata";
import { clientIp, isLikelyAutomatedAgent } from "@/lib/server/traffic";
import { verifyCampaignTrackingToken } from "@/lib/server/campaign-attribution";
import { isMaintenanceMode } from "@/lib/server/settings";

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const limit = await rateLimit(`outbound:${clientIp(request)}`, 120);
  if (!limit.success) return NextResponse.redirect(new URL("/discover?error=rate-limit", request.url), { status: 303 });
  const product = await findProductById(productId);
  if (!product || product.status !== "PUBLISHED" || !isValidOutboundUrl(product.websiteUrl)) {
    return NextResponse.redirect(new URL("/discover", request.url));
  }
  let destination: URL;
  try {
    destination = normalizeWebsiteUrl(product.websiteUrl);
    await assertSafeRemoteHost(destination.hostname);
  } catch {
    return NextResponse.redirect(new URL(`/product/${product.slug}?error=unsafe-url`, request.url));
  }
  const url = new URL(request.url);
  const parsed = clickSchema.safeParse({
    productId,
    campaignId: url.searchParams.get("campaignId") ?? undefined,
    placement: url.searchParams.get("placement") ?? "outbound",
    page: url.searchParams.get("page") ?? "product-profile",
    source: url.searchParams.get("source") ?? request.headers.get("referer")?.slice(0, 120) ?? undefined,
    sessionId: url.searchParams.get("sessionId") ?? undefined,
    trackingToken: url.searchParams.get("trackingToken") ?? undefined,
  });
  if (!parsed.success) return NextResponse.redirect(new URL(`/product/${product.slug}`, request.url));
  const placement = parsed.data.placement ?? "outbound";
  const page = parsed.data.page ?? "product-profile";
  const campaignId = parsed.data.campaignId && verifyCampaignTrackingToken({ token: parsed.data.trackingToken, campaignId: parsed.data.campaignId, productId: parsed.data.productId, placement, page }) ? parsed.data.campaignId : undefined;
  if (!(await isMaintenanceMode()) && !isLikelyAutomatedAgent(request.headers.get("user-agent"))) await recordOutboundClick(product, { ...parsed.data, campaignId });
  return NextResponse.redirect(destination.toString(), { status: 307 });
}
