import { CheckCircle2, CircleAlert, Gavel, RotateCcw } from "lucide-react";
import { listAdminBids } from "@/lib/repositories/admin";
import { getProductsByIds } from "@/lib/repositories/catalog";
import { cn, formatMoney } from "@/lib/utils";
import { RefundBidButton } from "@/components/admin/RefundBidButton";
import { DeskEmpty, DeskHeader, DeskPlaque } from "@/components/desk/DeskChrome";
import { ProductBoardBadge, ProductBoardCard } from "@/components/products/ProductBoardCard";
import { podiumStyle, type PodiumTone } from "@/components/products/product-board";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

type BidOpsStatus = "ACTIVE" | "PAID" | "FAILED" | "PENDING" | "REFUNDED" | "UNKNOWN";

function normalizeBidStatus(raw: string): BidOpsStatus {
  switch (raw) {
    case "ACTIVE":
      return "ACTIVE";
    case "PAID":
      return "PAID";
    case "FAILED":
      return "FAILED";
    case "PENDING":
      return "PENDING";
    case "REFUNDED":
      return "REFUNDED";
    default:
      return "UNKNOWN";
  }
}

function bidTone(status: BidOpsStatus): PodiumTone {
  switch (status) {
    case "ACTIVE":
      return "gold";
    case "PAID":
      return "gold";
    case "PENDING":
      return "silver";
    case "FAILED":
      return "bronze";
    case "REFUNDED":
      return "rest";
    case "UNKNOWN":
      return "rest";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default async function AdminBidsPage() {
  const bids = await listAdminBids();
  const products = await getProductsByIds(bids.map((bid) => typeof bid.productId === "string" ? bid.productId : ""));
  const byId = new Map(products.map((product) => [product.id, product]));
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Payment vault"
        title="Bids stay verifiable."
        description="Payment verification, activation state, refunds, and idempotency review from Firestore."
        icon={Gavel}
      />
      <div className="relative mt-8 grid gap-3">
        {bids.length ? bids.map((bid, index) => {
          const product = byId.get(String(bid.productId ?? ""));
          const amount = typeof bid.amountCents === "number" ? bid.amountCents : 0;
          const status = normalizeBidStatus(String(bid.status ?? "UNKNOWN"));
          const tone = bidTone(status);
          const style = podiumStyle(tone);
          if (!product) {
            return (
              <DeskPlaque key={bid.id} tone={tone}>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div>
                    <p className="font-black">Unknown product</p>
                    <p className="mt-1 text-xs text-muted">{String(bid.roundId ?? "No round")} · {String(bid.id)}</p>
                  </div>
                  <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>{status}</span>
                </div>
              </DeskPlaque>
            );
          }
          return (
            <ProductBoardCard
              key={bid.id}
              product={product}
              index={index}
              tone={tone}
              plaque="none"
              totals
              href={`/product/${product.slug}`}
              badge={<ProductBoardBadge className={style.badge}>{status}</ProductBoardBadge>}
              meta={
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted">
                  <span>{String(bid.roundId ?? "No round")}</span>
                  <span className="h-1 w-1 rounded-full bg-line" />
                  <span>{String(bid.id)}</span>
                </div>
              }
              stats={
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Amount</p>
                  <p className="display mt-1 text-2xl font-black leading-none text-ink">{formatMoney(amount)}</p>
                </div>
              }
              actions={
                <>
                  <RefundBidButton bidId={bid.id} status={String(bid.status ?? status)} freemiusLicenseId={typeof bid.freemiusLicenseId === "string" ? bid.freemiusLicenseId : undefined} />
                  <ButtonLink href={`/product/${product.slug}`} variant="secondary" size="sm" arrow>
                    View launch
                  </ButtonLink>
                </>
              }
            />
          );
        }) : <DeskEmpty title="No bid records are available." body="Confirmed Freemius payments will stamp into this vault." />}
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {[
          { icon: CheckCircle2, title: "Webhook first", text: "A frontend success state never activates placement.", tone: "gold" as const },
          { icon: RotateCcw, title: "Replay safe", text: "Freemius event IDs and license records are deterministic.", tone: "silver" as const },
          { icon: CircleAlert, title: "Manual review", text: "Refund requests are recorded locally and completed in Freemius Payments.", tone: "bronze" as const },
        ].map((item) => (
          <DeskPlaque key={item.title} tone={item.tone}>
            <item.icon size={18} className="text-coral" />
            <p className="mt-4 text-sm font-black">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{item.text}</p>
          </DeskPlaque>
        ))}
      </div>
    </div>
  );
}
