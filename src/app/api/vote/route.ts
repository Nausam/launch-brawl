import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { voteForProduct } from "@/lib/repositories/engagement";
import { voteSchema } from "@/lib/server/schemas";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";

export async function POST(request: Request) {
  if (!(await isFeatureEnabled("votingEnabled"))) return NextResponse.json({ error: "Voting is temporarily paused." }, { status: 503 });
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  const limit = await rateLimit(`vote:${user.id}`, 30);
  if (!limit.success) return NextResponse.json({ error: "Too many votes. Try again soon." }, { status: 429 });
  try {
    const parsed = voteSchema.parse(await request.json());
    const result = await voteForProduct(user.id, parsed.productId);
    return NextResponse.json({ ok: result.ok, votes: "votes" in result ? result.votes : undefined, message: result.message, alreadyVoted: "alreadyVoted" in result ? result.alreadyVoted : undefined }, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Invalid vote payload." }, { status: 400 });
  }
}
