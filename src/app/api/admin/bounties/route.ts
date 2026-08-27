import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { findProductById } from "@/lib/repositories/catalog";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const dateValue = z.string().trim().refine((value) => Number.isFinite(new Date(value).getTime()), "Use a valid ISO date.");
const bountySchema = z.object({
  type: z.enum(["DEFEAT_BOSS", "BREAK_STREAK", "GIANT_KILLER"]),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(400),
  targetProductId: z.string().max(120).optional(),
  categoryId: z.string().max(120).optional(),
  requirements: z.record(z.string(), z.union([z.number(), z.string()])).default({}),
  xpReward: z.number().int().min(0).max(100_000),
  achievementId: z.string().max(120).optional(),
  startsAt: dateValue,
  endsAt: dateValue,
}).refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), { message: "Bounty end must be after start.", path: ["endsAt"] });

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ bounties: [] });
  const snapshot = await db.collection("brawlBounties").limit(100).get();
  return NextResponse.json({ bounties: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const parsed = bountySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid bounty." }, { status: 400 });
  if (parsed.data.targetProductId) {
    const product = await findProductById(parsed.data.targetProductId);
    if (!product || product.status !== "PUBLISHED") return NextResponse.json({ error: "The target product must be published." }, { status: 409 });
  }
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const id = `bounty_${randomUUID()}`;
  const now = new Date();
  await db.collection("brawlBounties").doc(id).create({ id, ...parsed.data, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt), status: "ACTIVE", createdBy: admin.id, createdAt: now, updatedAt: now });
  await recordAdminAuditLog({ actorId: admin.id, action: "BOUNTY_CREATED", entityType: "bounty", entityId: id, requestId: requestId(request) });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
