import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const patchSchema = z.object({
  type: z.enum(["VOTE_BRAWLS", "DISCOVER_PRODUCTS", "PREDICT_BRAWLS", "VISIT_CATEGORIES", "DAILY_PICKS"]).optional(),
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(3).max(300).optional(),
  target: z.number().int().min(1).max(100).optional(),
  xpReward: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().optional(),
  version: z.number().int().min(1).max(1000).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one quest field is required.");

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid quest template." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const ref = db.collection("questTemplates").doc(id);
  if (!(await ref.get()).exists) return NextResponse.json({ error: "Quest template not found." }, { status: 404 });
  await ref.set({ ...parsed.data, updatedAt: new Date(), updatedBy: admin.id }, { merge: true });
  await recordAdminAuditLog({ actorId: admin.id, action: "QUEST_TEMPLATE_UPDATED", entityType: "questTemplate", entityId: id, requestId: requestId(request) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  await db.collection("questTemplates").doc(id).set({ active: false, updatedAt: new Date(), updatedBy: admin.id }, { merge: true });
  await recordAdminAuditLog({ actorId: admin.id, action: "QUEST_TEMPLATE_DEACTIVATED", entityType: "questTemplate", entityId: id, requestId: requestId(request) });
  return NextResponse.json({ ok: true });
}
