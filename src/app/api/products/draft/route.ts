import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { getAdminDb } from "@/lib/firebase/admin";
import { productDraftSchema } from "@/lib/server/schemas";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";

const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isExpired(value: unknown) {
  if (!value) return false;
  const date = value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
    ? value.toDate()
    : new Date(String(value));
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now();
}

function serializeDraft(data: FirebaseFirestore.DocumentData | undefined) {
  if (!data) return null;
  const updatedAt = data.updatedAt && typeof data.updatedAt === "object" && "toDate" in data.updatedAt && typeof data.updatedAt.toDate === "function"
    ? data.updatedAt.toDate().toISOString()
    : typeof data.updatedAt === "string" ? data.updatedAt : undefined;
  const expiresAt = data.expiresAt && typeof data.expiresAt === "object" && "toDate" in data.expiresAt && typeof data.expiresAt.toDate === "function"
    ? data.expiresAt.toDate().toISOString()
    : typeof data.expiresAt === "string" ? data.expiresAt : undefined;
  return { ...data, updatedAt, expiresAt };
}

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to load saved drafts." }, { status: 401 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ draft: null });
  const snapshot = await db.collection("productDrafts").doc(user.id).get();
  if (!snapshot.exists) return NextResponse.json({ draft: null });
  if (isExpired(snapshot.data()?.expiresAt)) {
    await snapshot.ref.delete();
    return NextResponse.json({ draft: null });
  }
  return NextResponse.json({ draft: serializeDraft(snapshot.data()) });
}

export async function PUT(request: Request) {
  if (!(await isFeatureEnabled("submissionsEnabled"))) return NextResponse.json({ error: "Product submissions are temporarily paused." }, { status: 503 });
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to save a draft." }, { status: 401 });
  const limit = await rateLimit(`product-draft:${user.id}`, 120, 60 * 60 * 1000);
  if (!limit.success) return NextResponse.json({ error: "Draft save limit reached. Try again later." }, { status: 429 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Product persistence is unavailable right now." }, { status: 503 });
  const parsed = productDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid draft." }, { status: 400 });
  const now = new Date();
  await db.collection("productDrafts").doc(user.id).set({
    ...parsed.data,
    userId: user.id,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + DRAFT_TTL_MS),
  }, { merge: true });
  return NextResponse.json({ ok: true, updatedAt: now.toISOString() });
}

export async function DELETE() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to clear a draft." }, { status: 401 });
  const db = getAdminDb();
  if (db) await db.collection("productDrafts").doc(user.id).delete();
  return NextResponse.json({ ok: true });
}
