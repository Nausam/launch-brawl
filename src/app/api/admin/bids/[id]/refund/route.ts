import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { requestFreemiusRefund } from "@/lib/repositories/payments";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const limit = await rateLimit(`admin-refund:${admin.id}`, 20, 60 * 60 * 1000);
  if (!limit.success) return NextResponse.json({ error: "Too many refund requests. Try again later." }, { status: 429 });
  const { id } = await params;
  try {
    const result = await requestFreemiusRefund(id, admin.id);
    if (result.ok) await recordAdminAuditLog({ actorId: admin.id, action: "BID_REFUND_REQUESTED", entityType: "bid", entityId: id, requestId: requestId(request) });
    return NextResponse.json(result, { status: result.ok ? 200 : result.message === "Bid not found." ? 404 : 409 });
  } catch {
    return NextResponse.json({ error: "Freemius refund reconciliation is unavailable." }, { status: 503 });
  }
}
