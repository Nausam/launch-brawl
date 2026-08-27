import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { runRoundLifecycleJob } from "@/lib/server/bidding";
import { recordAdminAuditLog } from "@/lib/server/audit";

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage sponsored rounds." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only administrators can open sponsored rounds." }, { status: 403 });
  try {
    const result = await runRoundLifecycleJob();
    await recordAdminAuditLog({ actorId: user.id, action: "ROUND_LIFECYCLE_RUN", entityType: "round", requestId: request.headers.get("x-request-id") ?? undefined });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "The round service is unavailable right now." }, { status: 503 });
  }
}
