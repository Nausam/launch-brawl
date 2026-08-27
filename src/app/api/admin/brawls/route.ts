import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { findProductById } from "@/lib/repositories/catalog";
import { isFeatureEnabled } from "@/lib/server/settings";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const dateValue = z.string().trim().refine((value) => Number.isFinite(new Date(value).getTime()), "Use a valid ISO date.");
const scheduleSchema = z.object({ productAId: z.string().min(1).max(120), productBId: z.string().min(1).max(120), categoryId: z.string().max(120).optional(), prompt: z.string().trim().min(10).max(240).default("Which product would you choose?"), startsAt: dateValue, endsAt: dateValue, status: z.enum(["SCHEDULED", "UPCOMING", "LIVE"]).default("SCHEDULED"), bossBrawl: z.boolean().default(false), bossProductId: z.string().max(120).optional(), seasonId: z.string().max(120).optional() }).refine((value) => value.productAId !== value.productBId, { message: "A product cannot Brawl itself." }).refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), { message: "Brawl end must be after start.", path: ["endsAt"] });

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const parsed = scheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid Brawl schedule." }, { status: 400 });
  if (parsed.data.bossBrawl && !(await isFeatureEnabled("bossBrawlsEnabled"))) return NextResponse.json({ error: "Boss Brawls are currently disabled." }, { status: 503 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const [left, right] = await Promise.all([findProductById(parsed.data.productAId), findProductById(parsed.data.productBId)]);
  if (!left || !right || left.status !== "PUBLISHED" || right.status !== "PUBLISHED") return NextResponse.json({ error: "Both products must be published." }, { status: 409 });
  if (parsed.data.categoryId && parsed.data.categoryId !== left.categoryId) return NextResponse.json({ error: "The selected category does not match product A." }, { status: 400 });
  if (left.categoryId !== right.categoryId && !parsed.data.categoryId) return NextResponse.json({ error: "Products must share a category unless an explicit category is supplied." }, { status: 400 });
  if (parsed.data.bossBrawl && parsed.data.bossProductId !== left.id && parsed.data.bossProductId !== right.id) return NextResponse.json({ error: "A Boss Brawl must identify one of its products as the Boss." }, { status: 400 });
  const ref = db.collection("brawls").doc();
  const now = new Date();
  await ref.create({ id: ref.id, productAId: left.id, productBId: right.id, leftProductId: left.id, rightProductId: right.id, categoryId: parsed.data.categoryId ?? left.categoryId, question: parsed.data.prompt, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt), status: parsed.data.status, bossBrawl: parsed.data.bossBrawl, ...(parsed.data.bossProductId ? { bossProductId: parsed.data.bossProductId } : {}), ...(parsed.data.seasonId ? { seasonId: parsed.data.seasonId } : {}), productAVotes: 0, productBVotes: 0, totalVotes: 0, createdBy: admin.id, createdAt: now, updatedAt: now });
  await recordAdminAuditLog({ actorId: admin.id, action: "BRAWL_SCHEDULED", entityType: "brawl", entityId: ref.id, requestId: requestId(request), metadata: { status: parsed.data.status, bossBrawl: parsed.data.bossBrawl } });
  return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
}
