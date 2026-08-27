import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { findProductById } from "@/lib/repositories/catalog";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";

const schema = z.object({ evidence: z.string().trim().max(500).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  if (!(await isFeatureEnabled("submissionsEnabled"))) return NextResponse.json({ error: "Ownership claims are temporarily paused." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to claim a product." }, { status: 401 });
  const limit = await rateLimit(`product-claim:${user.id}`, 5, 24 * 60 * 60 * 1000);
  if (!limit.success) return NextResponse.json({ error: "Too many ownership claims. Try again tomorrow." }, { status: 429 });
  const { id } = await params;
  const product = await findProductById(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  if (product.ownerId === user.id) return NextResponse.json({ error: "You already own this product." }, { status: 409 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid ownership evidence." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Ownership claims are unavailable until Firestore is configured." }, { status: 503 });
  const claimId = `${id}_${user.id}`;
  const ref = db.collection("productClaims").doc(claimId);
  const existing = await ref.get();
  if (existing.exists && String(existing.data()?.status ?? "") === "PENDING") return NextResponse.json({ error: "Your ownership claim is already under review." }, { status: 409 });
  await ref.set({ id: claimId, productId: id, claimantUserId: user.id, currentOwnerId: product.ownerId, evidence: parsed.data.evidence ?? "", status: "PENDING", createdAt: new Date(), updatedAt: new Date() }, { merge: true });
  await db.collection("products").doc(id).set({ ownershipStatus: "PENDING", updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ ok: true, claimId, message: "Your claim was sent for admin review." }, { status: 201 });
}
