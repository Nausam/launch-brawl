import { Flag, Package } from "lucide-react";
import type { ProductStatus } from "@/lib/types";
import { getAdminMetrics, listAdminProducts, listPendingProductClaims } from "@/lib/repositories/admin";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { ClaimReviewActions } from "@/components/admin/ClaimReviewActions";
import { DeskEmpty, DeskHeader, DeskPlaque, DeskStat, padTicket } from "@/components/desk/DeskChrome";
import { ProductBoardBadge, ProductBoardCard } from "@/components/products/ProductBoardCard";
import { podiumStyle, type PodiumTone } from "@/components/products/product-board";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function statusTone(status: ProductStatus): PodiumTone {
  switch (status) {
    case "PUBLISHED":
      return "gold";
    case "PENDING":
      return "bronze";
    case "DRAFT":
      return "rest";
    case "REJECTED":
      return "silver";
    case "ARCHIVED":
      return "rest";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default async function AdminProductsPage() {
  const [products, metrics, claims] = await Promise.all([listAdminProducts(), getAdminMetrics(), listPendingProductClaims()]);
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Intake window"
        title="Stamp the queue."
        description="Review, approve, reject, archive, feature, and audit the real directory queue."
        icon={Package}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Flag} value={String(metrics.pendingProducts)} label="Pending listings" tone="coral" />
        <DeskStat icon={Package} value={String(products.length)} label="Records in view" tone="blue" />
        <DeskStat icon={Flag} value={String(claims.length)} label="Ownership claims" tone="gold" />
      </div>
      <div className="relative mt-8 grid gap-3">
        {products.length ? products.map((product, index) => {
          const tone = statusTone(product.status);
          const style = podiumStyle(tone);
          return (
            <ProductBoardCard
              key={product.id}
              product={product}
              index={index}
              tone={tone}
              plaque="none"
              totals
              href={`/product/${product.slug}`}
              badge={<ProductBoardBadge className={style.badge}>{product.status}</ProductBoardBadge>}
              meta={
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted">
                  <span>Submitted by {product.makerName || product.ownerId || "Unknown maker"}</span>
                </div>
              }
              actions={
                <>
                  <ModerationActions productId={product.id} status={product.status} featured={product.featured} />
                  <ButtonLink href={`/product/${product.slug}`} variant="secondary" size="sm" arrow>
                    View launch
                  </ButtonLink>
                </>
              }
            />
          );
        }) : <DeskEmpty title="No product records are available." body="When listings land in Firestore they will stamp onto this intake window." />}
      </div>
      <section className="relative mt-10">
        <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">
          Ownership review
        </div>
        <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">Claims waiting for evidence</h2>
        <div className="mt-4 grid gap-3">
          {claims.length ? claims.map((claim, index) => (
            <DeskPlaque key={claim.id} tone="silver">
              <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                <span className="grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border border-[#b7cfe0] bg-[#eef6fc] text-[11px] font-black text-[#355875]">{padTicket(index)}</span>
                <div>
                  <p className="text-sm font-black">{claim.productId}</p>
                  <p className="mt-1 text-xs text-muted">Claimant {claim.claimantUserId} · {claim.createdAt}</p>
                  <p className="mt-2 text-xs text-muted">{claim.evidence || "No evidence attached."}</p>
                </div>
                <ClaimReviewActions productId={claim.productId} claimId={claim.id} />
              </div>
            </DeskPlaque>
          )) : <DeskEmpty title="No pending ownership claims." body="Evidence packets will land here when someone claims an unowned listing." />}
        </div>
      </section>
      <p className="mt-6 text-xs text-muted">{metrics.pendingProducts} pending review · changes are written to Firestore with an admin audit log.</p>
    </div>
  );
}
