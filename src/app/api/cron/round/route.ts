import { NextResponse } from "next/server";
import { finalizeRound } from "@/lib/server/bidding";
import { runRoundLifecycleJob } from "@/lib/server/bidding";
import { reconcilePendingFreemiusPurchases } from "@/lib/repositories/payments";
import { isCronAuthorized } from "@/lib/server/cron";
import { logger } from "@/lib/server/log";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const roundId = new URL(request.url).searchParams.get("roundId"); const [rounds, payments] = await Promise.all([roundId ? finalizeRound(roundId) : runRoundLifecycleJob(), reconcilePendingFreemiusPurchases()]); return NextResponse.json({ rounds, payments }); } catch (error) { logger.error("cron_round_lifecycle_failed", { reason: error instanceof Error ? error.message : "unknown" }); return NextResponse.json({ error: "Round job failed." }, { status: 500 }); }
}
