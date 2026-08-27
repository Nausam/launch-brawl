import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const schema = z.object({ action: z.enum(["APPROVE", "REJECT"]), claimId: z.string().min(1).max(160).optional(), reason: z.string().trim().max(500).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid claim decision." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const { id: productId } = await params;
  const claimSnapshot = parsed.data.claimId ? await db.collection("productClaims").doc(parsed.data.claimId).get() : (await db.collection("productClaims").where("productId", "==", productId).where("status", "==", "PENDING").limit(1).get()).docs[0];
  if (!claimSnapshot?.exists) return NextResponse.json({ error: "Pending ownership claim not found." }, { status: 404 });
  const claimRef = claimSnapshot.ref;
  const productRef = db.collection("products").doc(productId);
  const claim = claimSnapshot.data() ?? {};
  const claimantUserId = String(claim.claimantUserId ?? "");
  if (String(claim.productId ?? productId) !== productId || !claimantUserId) return NextResponse.json({ error: "Claim does not match this product." }, { status: 409 });
  await db.runTransaction(async (transaction) => {
    const claimantRef = db.collection("users").doc(claimantUserId);
    const [currentClaim, product, claimant] = await Promise.all([transaction.get(claimRef), transaction.get(productRef), transaction.get(claimantRef)]);
    if (!currentClaim.exists || String(currentClaim.data()?.status ?? "") !== "PENDING") throw new Error("Claim is no longer pending.");
    if (!product.exists) throw new Error("Product not found.");
    if (!claimant.exists) throw new Error("Claimant user not found.");
    const currentMembers = Array.isArray(product.data()?.makerIds) ? product.data()?.makerIds.map(String) : [];
    const currentOwnerId = String(product.data()?.ownerId ?? "");
    const claimantData = claimant.data() ?? {};
    const approved = parsed.data.action === "APPROVE";
    transaction.update(claimRef, { status: approved ? "APPROVED" : "REJECTED", reviewedBy: admin.id, reviewedAt: new Date(), reviewReason: parsed.data.reason ?? "", updatedAt: new Date() });
    transaction.set(productRef, approved ? { ownerId: claimantUserId, makerName: String(claimantData.displayName ?? "Maker"), makerAvatarUrl: String(claimantData.imageUrl ?? ""), makerIds: [...new Set([...currentMembers, claimantUserId])], makerCount: new Set([...currentMembers, claimantUserId]).size, ownershipStatus: "VERIFIED", updatedAt: new Date() } : { ownershipStatus: "UNCLAIMED", updatedAt: new Date() }, { merge: true });
    if (approved) {
      transaction.set(db.collection("productMembers").doc(`${productId}_${claimantUserId}`), { id: `${productId}_${claimantUserId}`, productId, userId: claimantUserId, role: "OWNER", status: "ACTIVE", createdAt: new Date(), updatedAt: new Date() }, { merge: true });
      if (currentOwnerId && currentOwnerId !== claimantUserId) transaction.set(db.collection("productMembers").doc(`${productId}_${currentOwnerId}`), { role: "VIEWER", status: "REMOVED", updatedAt: new Date() }, { merge: true });
    }
    transaction.set(db.collection("notifications").doc(`PRODUCT_CLAIM_${claimantUserId}_${productId}`), { id: `PRODUCT_CLAIM_${claimantUserId}_${productId}`, userId: claimantUserId, type: approved ? "PRODUCT_CLAIM_APPROVED" : "PRODUCT_CLAIM_REJECTED", title: approved ? "Ownership claim approved" : "Ownership claim rejected", body: parsed.data.reason ?? (approved ? "You can now manage this product." : "The admin team did not approve this claim."), entityId: productId, read: false, emailStatus: "SKIPPED", createdAt: new Date() }, { merge: true });
  });
  await recordAdminAuditLog({ actorId: admin.id, action: `PRODUCT_CLAIM_${parsed.data.action}`, entityType: "productClaim", entityId: claimRef.id, requestId: requestId(request), metadata: { productId, reason: parsed.data.reason ?? "" } });
  return NextResponse.json({ ok: true, status: parsed.data.action === "APPROVE" ? "APPROVED" : "REJECTED" });
}
