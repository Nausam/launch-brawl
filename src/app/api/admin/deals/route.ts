import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { findProductById } from "@/lib/repositories/catalog";
import { requireAdmin } from "@/lib/integrations/auth";
import { optionalPublicHttpUrl } from "@/lib/server/schemas";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const optionalDate = z.preprocess((value) => value === "" ? undefined : value, z.string().refine((value) => Number.isFinite(new Date(value).getTime()), "Use a valid date.").optional());
const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, optionalPublicHttpUrl);
const dealSchema = z.object({
  productId: z.string().min(1).max(120),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  terms: z.string().trim().max(500).default(""),
  couponCode: z.string().trim().max(80).optional(),
  destinationUrl: optionalUrl,
  startsAt: optionalDate,
  expiresAt: optionalDate,
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "ARCHIVED"]).default("DRAFT"),
}).refine((value) => !value.startsAt || !value.expiresAt || new Date(value.expiresAt).getTime() > new Date(value.startsAt).getTime(), { message: "The expiry must be after the start date.", path: ["expiresAt"] });

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const parsed = dealSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid deal." }, { status: 400 });
  const product = await findProductById(parsed.data.productId);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  if (parsed.data.status === "ACTIVE" && product.status !== "PUBLISHED") return NextResponse.json({ error: "Only published products can have an active deal." }, { status: 409 });
  const ref = db.collection("deals").doc();
  const now = new Date();
  await ref.create({ id: ref.id, ...parsed.data, createdBy: admin.id, createdAt: now, updatedAt: now });
  await recordAdminAuditLog({ actorId: admin.id, action: "DEAL_CREATED", entityType: "deal", entityId: ref.id, requestId: requestId(request), metadata: { status: parsed.data.status } });
  return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
}
