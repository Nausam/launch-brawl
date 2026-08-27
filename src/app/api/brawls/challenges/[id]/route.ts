import { NextResponse } from "next/server";
import { challengeResponseSchema } from "@/lib/server/schemas";
import { respondToBrawlChallenge } from "@/lib/server/brawl-service";
import { clientIp } from "@/lib/server/traffic";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { logger } from "@/lib/server/log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(`brawl-challenge-response:${clientIp(request)}`, 10);
  if (!limit.success) return NextResponse.json({ error: "Too many challenge responses. Try again soon." }, { status: 429 });
  const { id } = await params;
  let action: "ACCEPT" | "DECLINE";
  try {
    action = challengeResponseSchema.parse(await request.json()).action;
  } catch {
    return NextResponse.json({ error: "Invalid challenge response." }, { status: 400 });
  }
  try {
    const result = await respondToBrawlChallenge(id, action);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    logger.error("brawl_challenge_response_failed", { challengeId: id, action, reason: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Unable to answer this challenge right now." }, { status: 500 });
  }
}
