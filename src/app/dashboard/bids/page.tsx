import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Clock3, Gavel, RotateCcw } from "lucide-react";
import type { CampaignStatus } from "@/lib/types";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { findOwnerProduct, listOwnerCampaigns } from "@/lib/repositories/owner";
import { cn, formatMoney, relativeTime } from "@/lib/utils";
import { EmptyPanel } from "@/components/dashboard/EmptyPanel";
import { ProductBoardBadge, ProductBoardCard } from "@/components/products/ProductBoardCard";
import { podiumStyle, type PodiumTone } from "@/components/products/product-board";
import { DeskHeader, DeskPlaque } from "@/components/desk/DeskChrome";
import { ButtonLink } from "@/components/ui/Button";

function campaignTone(status: CampaignStatus): PodiumTone {
  switch (status) {
    case "ACTIVE":
      return "gold";
    case "PENDING":
      return "silver";
    case "COMPLETED":
      return "rest";
    case "PAUSED":
      return "bronze";
    case "EXPIRED":
      return "bronze";
    case "REFUNDED":
      return "rest";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function campaignLabel(status: CampaignStatus) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "ACTIVE":
      return "Delivering";
    case "COMPLETED":
      return "Completed";
    case "PAUSED":
      return "Paused";
    case "EXPIRED":
      return "Expired";
    case "REFUNDED":
      return "Refunded";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default async function DashboardBidsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  const campaigns = await listOwnerCampaigns(user.id);
  return (
    <div>
      <DeskHeader
        kind="owner"
        eyebrow="Gavel ledger"
        title="What you bid, and what it bought."
        description="A permanent record of the amount, the position it reached, and the campaign allocation created with it."
        icon={Gavel}
      />
      <div className="relative mt-8 grid gap-3">
        {campaigns.length ? (
          campaigns.map((campaign, index) => (
            <BidSlip key={campaign.id} index={index} campaignId={campaign.id} productId={campaign.productId} productName={campaign.productName} amountCents={campaign.purchasedAmountCents} status={campaign.status} startedAt={campaign.startedAt} ownerId={user.id} />
          ))
        ) : (
          <EmptyPanel title="No bids yet" body="Confirmed bids for products you own will appear here after Freemius checkout succeeds." href="/#daily-brawl" action="Go to the live board" />
        )}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: CheckCircle2, title: "Payment verified", text: "Freemius webhooks, signed redirects, and automatic reconciliation confirm successful payments before activation.", tone: "gold" as const },
          { icon: RotateCcw, title: "Outbid? Still useful.", text: "Promotional credits remain attached to the campaign you purchased.", tone: "silver" as const },
          { icon: Clock3, title: "Round-aware", text: "Bids are validated against the authoritative active round.", tone: "rest" as const },
        ].map((item) => (
          <DeskPlaque key={item.title} tone={item.tone}>
            <item.icon size={18} className="text-coral" />
            <p className="mt-4 text-sm font-black">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{item.text}</p>
          </DeskPlaque>
        ))}
      </div>
      <Link href="/#daily-brawl" className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
        Return to the live board <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}

async function BidSlip({ index, campaignId, productId, productName, amountCents, status, startedAt, ownerId }: { index: number; campaignId: string; productId: string; productName: string; amountCents: number; status: CampaignStatus; startedAt: string; ownerId: string }) {
  const product = await findOwnerProduct(ownerId, productId);
  const tone = campaignTone(status);
  const style = podiumStyle(tone);
  if (!product) {
    return (
      <DeskPlaque tone={tone}>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div>
            <p className="font-black text-ink">{productName}</p>
            <p className="mt-1 text-xs text-muted">{relativeTime(startedAt)} · bid {campaignId.slice(-6)}</p>
          </div>
          <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
            {campaignLabel(status)}
          </span>
        </div>
      </DeskPlaque>
    );
  }
  return (
    <ProductBoardCard
      product={product}
      index={index}
      tone={tone}
      plaque="none"
      totals
      href={`/dashboard/products/${product.id}`}
      badge={<ProductBoardBadge className={style.badge}>{campaignLabel(status)}</ProductBoardBadge>}
      meta={
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted">
          <span>{relativeTime(startedAt)}</span>
          <span className="h-1 w-1 rounded-full bg-line" />
          <span>bid {campaignId.slice(-6)}</span>
        </div>
      }
      stats={
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Amount</p>
            <p className="display mt-1 text-2xl font-black leading-none text-ink">{formatMoney(amountCents)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Position</p>
            <p className="display mt-1 text-2xl font-black leading-none text-ink">{product.position ? `#${product.position}` : "—"}</p>
          </div>
        </div>
      }
      actions={
        <ButtonLink href={`/dashboard/campaigns/${campaignId}`} variant="secondary" size="sm" arrow>
          Details
        </ButtonLink>
      }
    />
  );
}
