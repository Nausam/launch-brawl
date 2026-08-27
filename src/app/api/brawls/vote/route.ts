import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { castBrawlVote } from "@/lib/server/brawl-service";
import { brawlVoteSchema } from "@/lib/server/schemas";
import { clientIp } from "@/lib/server/traffic";

export async function POST(request: Request) {
  const limit = await rateLimit(`brawl-vote:${clientIp(request)}`, 20);
  if (!limit.success) return NextResponse.json({ error: "Too many Brawl votes. Try again soon." }, { status: 429 });
  try {
    const payload = brawlVoteSchema.parse(await request.json());
    const result = await castBrawlVote(payload.brawlId, payload.selectedProductId);
    return NextResponse.json(result, { status: result.ok ? 200 : result.alreadyVoted ? 409 : 400 });
  } catch {
    return NextResponse.json({ error: "Invalid Brawl vote payload." }, { status: 400 });
  }
}
