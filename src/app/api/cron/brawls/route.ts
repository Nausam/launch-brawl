import { NextResponse } from "next/server";
import { runBrawlLifecycleJob, runSeasonRolloverJob } from "@/lib/server/brawl-service";
import { runRoundLifecycleJob } from "@/lib/server/bidding";
import { runMaintenanceJobs } from "@/lib/server/maintenance";
import { reconcilePendingFreemiusPurchases } from "@/lib/repositories/payments";
import { isCronAuthorized } from "@/lib/server/cron";
import { logger } from "@/lib/server/log";

export const runtime = "nodejs";

async function run(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const [brawls, rounds, maintenance, seasons, payments] = await Promise.all([runBrawlLifecycleJob(), runRoundLifecycleJob(), runMaintenanceJobs(), runSeasonRolloverJob(), reconcilePendingFreemiusPurchases()]); return NextResponse.json({ brawls, rounds, maintenance, seasons, payments }); } catch (error) { logger.error("cron_brawl_lifecycle_failed", { reason: error instanceof Error ? error.message : "unknown" }); return NextResponse.json({ error: "Lifecycle job failed." }, { status: 500 }); }
}

export async function POST(request: Request) { return run(request); }
export async function GET(request: Request) { return run(request); }
