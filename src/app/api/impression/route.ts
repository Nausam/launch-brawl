import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { recordQualifiedImpression } from "@/lib/repositories/engagement";
import { impressionSchema } from "@/lib/server/schemas";
import { clientIp, isLikelyAutomatedAgent } from "@/lib/server/traffic";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";
import { verifyCampaignTrackingToken } from "@/lib/server/campaign-attribution";

export async function POST(request: Request) {
  if (!(await isFeatureEnabled("campaignDeliveryEnabled"))) return NextResponse.json({ error: "Campaign delivery is paused." }, { status: 503 });
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  if (isLikelyAutomatedAgent(request.headers.get("user-agent"))) return NextResponse.json({ ok: true, qualified: false, message: "Automated traffic is not counted." });
  const limit = await rateLimit(`impression:${clientIp(request)}`, 120);
  if (!limit.success) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  try {
    const parsed = impressionSchema.parse(await request.json());
    if (!verifyCampaignTrackingToken({ token: parsed.trackingToken, campaignId: parsed.campaignId, productId: parsed.productId, placement: parsed.placement, page: parsed.page })) return NextResponse.json({ error: "Invalid campaign attribution." }, { status: 400 });
    const result = await recordQualifiedImpression(parsed);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ error: "Invalid impression payload." }, { status: 400 });
  }
}
