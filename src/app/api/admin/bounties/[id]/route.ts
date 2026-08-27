import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const dateValue = z.string().trim().refine((value) => Number.isFinite(new Date(value).getTime()), "Use a valid ISO date.");
const patchSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(3).max(400).optional(),
  targetProductId: z.string().max(120).optional(),
  categoryId: z.string().max(120).optional(),
  requirements: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  xpReward: z.number().int().min(0).max(100_000).optional(),
  achievementId: z.string().max(120).optional(),
  startsAt: dateValue.optional(),
  endsAt: dateValue.optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "EXPIRED"]).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one bounty field is required.");

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid bounty." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const ref = db.collection("brawlBounties").doc(id);
  const current = await ref.get();
  if (!current.exists) return NextResponse.json({ error: "Bounty not found." }, { status: 404 });
  const currentData = current.data() ?? {};
  const startsAt = parsed.data.startsAt ?? String(currentData.startsAt?.toDate?.() ?? currentData.startsAt ?? "");
  const endsAt = parsed.data.endsAt ?? String(currentData.endsAt?.toDate?.() ?? currentData.endsAt ?? "");
  if (Number.isFinite(new Date(startsAt).getTime()) && Number.isFinite(new Date(endsAt).getTime()) && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) return NextResponse.json({ error: "Bounty end must be after start." }, { status: 400 });
  const data = { ...parsed.data, ...(parsed.data.startsAt ? { startsAt: new Date(parsed.data.startsAt) } : {}), ...(parsed.data.endsAt ? { endsAt: new Date(parsed.data.endsAt) } : {}), updatedAt: new Date(), updatedBy: admin.id };
  await ref.set(data, { merge: true });
  await recordAdminAuditLog({ actorId: admin.id, action: "BOUNTY_UPDATED", entityType: "bounty", entityId: id, requestId: requestId(request) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  await db.collection("brawlBounties").doc(id).set({ status: "EXPIRED", endedBy: admin.id, endedAt: new Date(), updatedAt: new Date() }, { merge: true });
  await recordAdminAuditLog({ actorId: admin.id, action: "BOUNTY_EXPIRED", entityType: "bounty", entityId: id, requestId: requestId(request) });
  return NextResponse.json({ ok: true });
}
