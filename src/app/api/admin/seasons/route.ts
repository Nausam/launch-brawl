import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const dateValue = z.string().trim().refine((value) => Number.isFinite(new Date(value).getTime()), "Use a valid ISO date.");
const seasonSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  name: z.string().trim().min(3).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  startsAt: dateValue,
  endsAt: dateValue,
  current: z.boolean().default(false),
}).refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), { message: "Season end must be after start.", path: ["endsAt"] });

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

function serialize(document: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) {
  const data = document.data();
  const iso = (value: unknown) => value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function" ? value.toDate().toISOString() : String(value ?? "");
  return { id: document.id, ...data, startsAt: iso(data.startsAt), endsAt: iso(data.endsAt), createdAt: iso(data.createdAt), finalizedAt: data.finalizedAt ? iso(data.finalizedAt) : undefined };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ seasons: [] });
  const snapshot = await db.collection("brawlSeasons").limit(100).get();
  return NextResponse.json({ seasons: snapshot.docs.map(serialize) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const parsed = seasonSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid season." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const id = parsed.data.id || parsed.data.slug || slugify(parsed.data.name);
  const slug = parsed.data.slug || id;
  const ref = db.collection("brawlSeasons").doc(id);
  const now = new Date();
  try {
    await db.runTransaction(async (transaction) => {
      if ((await transaction.get(ref)).exists) throw new Error("SEASON_EXISTS");
      if (parsed.data.current) {
        const current = await transaction.get(db.collection("brawlSeasons").where("current", "==", true).limit(10));
        for (const document of current.docs) transaction.update(document.ref, { current: false, status: "COMPLETED", updatedAt: now });
      }
      transaction.create(ref, { id, slug, name: parsed.data.name, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt), status: parsed.data.current ? "ACTIVE" : "UPCOMING", current: parsed.data.current, createdAt: now, updatedAt: now, createdBy: admin.id });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SEASON_EXISTS") return NextResponse.json({ error: "A season with that ID already exists." }, { status: 409 });
    return NextResponse.json({ error: "The season could not be created." }, { status: 500 });
  }
  await recordAdminAuditLog({ actorId: admin.id, action: "SEASON_CREATED", entityType: "season", entityId: id, requestId: requestId(request), metadata: { current: parsed.data.current } });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
