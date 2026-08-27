import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { finalizeBrawl } from "@/lib/server/brawl-service";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const configuredAdmins = (process.env.ADMIN_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (configuredAdmins.length > 0 && !configuredAdmins.includes(user.id) && user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const result = await finalizeBrawl(id, true);
  if (result.ok) await recordAdminAuditLog({ actorId: user.id, action: "BRAWL_FORCE_FINALIZED", entityType: "brawl", entityId: id, requestId: requestId(_), metadata: { idempotent: Boolean(result.idempotent) } });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
