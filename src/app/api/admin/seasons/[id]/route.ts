import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const dateValue = z.string().trim().refine((value) => Number.isFinite(new Date(value).getTime()), "Use a valid ISO date.");
const patchSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  startsAt: dateValue.optional(),
  endsAt: dateValue.optional(),
  status: z.enum(["UPCOMING", "ACTIVE", "FINALIZING", "COMPLETED"]).optional(),
  current: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one season field is required.");

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid season." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const ref = db.collection("brawlSeasons").doc(id);
  const now = new Date();
  try {
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (!current.exists) throw new Error("SEASON_NOT_FOUND");
      const currentData = current.data() ?? {};
      const startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : currentData.startsAt;
      const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : currentData.endsAt;
      if (new Date(endsAt?.toDate?.() ?? endsAt).getTime() <= new Date(startsAt?.toDate?.() ?? startsAt).getTime()) throw new Error("SEASON_DATES");
      if (parsed.data.current === true) {
        const active = await transaction.get(db.collection("brawlSeasons").where("current", "==", true).limit(10));
        for (const document of active.docs) if (document.id !== id) transaction.update(document.ref, { current: false, status: "COMPLETED", updatedAt: now });
      }
      transaction.update(ref, { ...parsed.data, ...(parsed.data.startsAt ? { startsAt } : {}), ...(parsed.data.endsAt ? { endsAt } : {}), ...(parsed.data.current !== undefined ? { status: parsed.data.current ? "ACTIVE" : parsed.data.status ?? currentData.status } : {}), updatedAt: now, updatedBy: admin.id });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SEASON_NOT_FOUND") return NextResponse.json({ error: "Season not found." }, { status: 404 });
    if (error instanceof Error && error.message === "SEASON_DATES") return NextResponse.json({ error: "Season end must be after start." }, { status: 400 });
    return NextResponse.json({ error: "The season could not be updated." }, { status: 500 });
  }
  await recordAdminAuditLog({ actorId: admin.id, action: "SEASON_UPDATED", entityType: "season", entityId: id, requestId: requestId(request) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  await db.collection("brawlSeasons").doc(id).set({ current: false, status: "COMPLETED", archivedAt: new Date(), updatedAt: new Date(), updatedBy: admin.id }, { merge: true });
  await recordAdminAuditLog({ actorId: admin.id, action: "SEASON_ARCHIVED", entityType: "season", entityId: id, requestId: requestId(request) });
  return NextResponse.json({ ok: true });
}
