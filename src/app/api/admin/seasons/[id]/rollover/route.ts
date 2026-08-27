import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/integrations/auth";
import { runSeasonRolloverJob } from "@/lib/server/brawl-service";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const result = await runSeasonRolloverJob();
  if (result.finalized) await recordAdminAuditLog({ actorId: admin.id, action: "SEASON_ROLLOVER_RUN", entityType: "season", entityId: id, requestId: requestId(request), metadata: { message: result.message } });
  return NextResponse.json(result, { status: result.mode === "unconfigured" ? 503 : 200 });
}
