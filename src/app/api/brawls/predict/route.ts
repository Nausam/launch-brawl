import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { createBrawlPrediction } from "@/lib/server/brawl-service";
import { brawlPredictionSchema } from "@/lib/server/schemas";
import { clientIp } from "@/lib/server/traffic";

export async function POST(request: Request) {
  const limit = await rateLimit(`brawl-prediction:${clientIp(request)}`, 20);
  if (!limit.success) return NextResponse.json({ error: "Too many prediction attempts. Try again soon." }, { status: 429 });
  try {
    const payload = brawlPredictionSchema.parse(await request.json());
    const result = await createBrawlPrediction(payload.brawlId, payload.predictedProductId);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ error: "Invalid prediction payload." }, { status: 400 });
  }
}
