import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const schema = z.object({ action: z.enum(["CANCEL", "RESCHEDULE", "FEATURE", "INVESTIGATE"]), startsAt: z.string().optional(), endsAt: z.string().optional(), reason: z.string().trim().max(500).optional() }).refine((value) => value.action !== "RESCHEDULE" || (value.startsAt && value.endsAt && new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime()), { message: "Rescheduling requires an end after the start." });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid Brawl lifecycle action." }, { status: 400 });
  const { id } = await params;
  const ref = db.collection("brawls").doc(id);
  const current = await ref.get();
  if (!current.exists) return NextResponse.json({ error: "Brawl not found." }, { status: 404 });
  const now = new Date();
  const update = parsed.data.action === "CANCEL" ? { status: "CANCELLED", cancelledAt: now, cancelledBy: admin.id, cancellationReason: parsed.data.reason ?? "", updatedAt: now } : parsed.data.action === "FEATURE" ? { featured: true, featuredBy: admin.id, featuredAt: now, updatedAt: now } : parsed.data.action === "INVESTIGATE" ? { investigation: { openedBy: admin.id, openedAt: now, reason: parsed.data.reason ?? "" }, updatedAt: now } : { startsAt: new Date(parsed.data.startsAt!), endsAt: new Date(parsed.data.endsAt!), status: "SCHEDULED", rescheduledBy: admin.id, rescheduledAt: now, rescheduleReason: parsed.data.reason ?? "", updatedAt: now };
  await ref.set(update, { merge: true });
  await recordAdminAuditLog({ actorId: admin.id, action: `BRAWL_${parsed.data.action}`, entityType: "brawl", entityId: id, requestId: requestId(request), metadata: { reason: parsed.data.reason ?? "" } });
  return NextResponse.json({ ok: true, id, action: parsed.data.action });
}
