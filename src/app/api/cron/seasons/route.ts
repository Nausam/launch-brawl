import { NextResponse } from "next/server";
import { runSeasonRolloverJob } from "@/lib/server/brawl-service";
import { isCronAuthorized } from "@/lib/server/cron";
import { logger } from "@/lib/server/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await runSeasonRolloverJob()); } catch (error) { logger.error("cron_season_rollover_failed", { reason: error instanceof Error ? error.message : "unknown" }); return NextResponse.json({ error: "Season rollover failed." }, { status: 500 }); }
}
