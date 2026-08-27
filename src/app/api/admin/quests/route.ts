import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const questTemplateSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  type: z.enum(["VOTE_BRAWLS", "DISCOVER_PRODUCTS", "PREDICT_BRAWLS", "VISIT_CATEGORIES", "DAILY_PICKS"]),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(300),
  target: z.number().int().min(1).max(100),
  xpReward: z.number().int().min(0).max(10_000),
  active: z.boolean().default(true),
  version: z.number().int().min(1).max(1000).default(1),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ templates: [] });
  const snapshot = await db.collection("questTemplates").limit(100).get();
  return NextResponse.json({ templates: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const parsed = questTemplateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid quest template." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const id = parsed.data.id || slugify(parsed.data.title);
  if (!id) return NextResponse.json({ error: "Quest template needs a usable ID." }, { status: 400 });
  const ref = db.collection("questTemplates").doc(id);
  const now = new Date();
  const template = { ...parsed.data };
  delete template.id;
  try {
    await ref.create({ ...template, id, createdBy: admin.id, createdAt: now, updatedAt: now });
  } catch {
    return NextResponse.json({ error: "A quest template with that ID already exists." }, { status: 409 });
  }
  await recordAdminAuditLog({ actorId: admin.id, action: "QUEST_TEMPLATE_CREATED", entityType: "questTemplate", entityId: id, requestId: requestId(request) });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
