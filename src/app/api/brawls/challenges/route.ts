import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { createBrawlChallenge } from "@/lib/server/brawl-service";
import { brawlChallengeSchema } from "@/lib/server/schemas";
import { clientIp } from "@/lib/server/traffic";

export async function POST(request: Request) {
  const limit = await rateLimit(`brawl-challenge:${clientIp(request)}`, 5, 3_600_000);
  if (!limit.success) return NextResponse.json({ error: "Challenge limit reached. Try again later." }, { status: 429 });
  try {
    const payload = brawlChallengeSchema.parse(await request.json());
    const result = await createBrawlChallenge(payload);
    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch {
    return NextResponse.json({ error: "Invalid challenge payload." }, { status: 400 });
  }
}
