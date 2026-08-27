import { NextResponse } from "next/server";
import { runMaintenanceJobs } from "@/lib/server/maintenance";
import { isCronAuthorized } from "@/lib/server/cron";
import { logger } from "@/lib/server/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await runMaintenanceJobs()); } catch (error) { logger.error("cron_maintenance_failed", { reason: error instanceof Error ? error.message : "unknown" }); return NextResponse.json({ error: "Maintenance job failed." }, { status: 500 }); }
}
