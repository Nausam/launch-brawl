import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { findProductById } from "@/lib/repositories/catalog";
import { requestId } from "@/lib/server/request";
import { recordAdminAuditLog } from "@/lib/server/audit";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT", "ARCHIVE", "UNARCHIVE", "FEATURE", "UNFEATURE"]),
  reason: z.string().trim().min(1, "A moderation reason is required.").max(500),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const { id } = await params;
  const product = await findProductById(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid moderation payload." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const status = parsed.data.action === "APPROVE" ? "PUBLISHED" : parsed.data.action === "REJECT" ? "REJECTED" : parsed.data.action === "ARCHIVE" ? "ARCHIVED" : parsed.data.action === "UNARCHIVE" ? "PENDING" : undefined;
  const update = {
    ...(status ? { status } : {}),
    ...(parsed.data.action === "FEATURE" ? { featured: true } : {}),
    ...(parsed.data.action === "UNFEATURE" ? { featured: false } : {}),
    updatedAt: new Date(),
    moderatedBy: admin.id,
    moderationReason: parsed.data.reason,
  };
  await db.collection("products").doc(id).update(update);
  await recordAdminAuditLog({ actorId: admin.id, action: `PRODUCT_${parsed.data.action}`, entityType: "product", entityId: id, requestId: requestId(request), metadata: { reason: parsed.data.reason } });
  return NextResponse.json({ ok: true, status: status ?? product.status, featured: parsed.data.action === "FEATURE" ? true : parsed.data.action === "UNFEATURE" ? false : product.featured });
}
