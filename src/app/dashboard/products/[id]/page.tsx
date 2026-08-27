import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, BarChart3, Eye, MousePointer2, Package } from "lucide-react";
import type { ProductStatus } from "@/lib/types";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { findOwnerProduct, listOwnerCampaigns, listProductMembers } from "@/lib/repositories/owner";
import { getCurrentRound, listCategories } from "@/lib/repositories/catalog";
import { cn, formatCompact, formatMoney } from "@/lib/utils";
import { ProductLogo } from "@/components/products/ProductLogo";
import { EmptyPanel } from "@/components/dashboard/EmptyPanel";
import { CampaignProgress } from "@/components/dashboard/CampaignProgress";
import { BidDialog } from "@/components/leaderboard/BidDialog";
import { ButtonLink } from "@/components/ui/Button";
import { ProductEditor } from "@/components/dashboard/ProductEditor";
import { ProductMembersPanel } from "@/components/dashboard/ProductMembersPanel";
import { DeskHeader, DeskPlaque, DeskStat, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Product ${id}` };
}

function statusTone(status: ProductStatus): RankTone {
  switch (status) {
    case "PUBLISHED":
      return "gold";
    case "PENDING":
      return "silver";
    case "DRAFT":
      return "rest";
    case "REJECTED":
      return "bronze";
    case "ARCHIVED":
      return "rest";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusLabel(status: ProductStatus) {
  switch (status) {
    case "PUBLISHED":
      return "Live";
    case "PENDING":
      return "In review";
    case "DRAFT":
      return "Draft";
    case "REJECTED":
      return "Rejected";
    case "ARCHIVED":
      return "Archived";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default async function OwnerProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;
  const product = await findOwnerProduct(user.id, id);
  if (!product) notFound();
  const [ownerCampaigns, round, categories, members] = await Promise.all([listOwnerCampaigns(user.id), getCurrentRound(), listCategories(), listProductMembers(product.id)]);
  const campaigns = ownerCampaigns.filter((campaign) => campaign.productId === product.id);
  const campaign = campaigns[0];
  const canBid = product.status === "PUBLISHED" && Boolean(round);
  const tone = statusTone(product.status);
  const style = rankStyle(tone);
  const bidBody = product.status !== "PUBLISHED"
    ? "This product can receive bids after it is published."
    : round
      ? "Start a bid to create promotional impression credits for this product."
      : "There is no active sponsored round right now. An administrator must open one before bidding.";
  const bidAction = canBid
    ? <BidDialog productId={product.id} productName={product.name} currentBidCents={round?.winningBidCents ?? product.bidCents} roundId={round!.id} buttonLabel="Start a bid" buttonSize="compact" />
    : <ButtonLink href="/#daily-brawl" variant="primary" size="sm" arrow className="uppercase tracking-[0.08em]">View the live board</ButtonLink>;

  return (
    <div>
      <DeskHeader
        kind="owner"
        eyebrow="Listing dock"
        title={product.name}
        description={product.shortDescription}
        icon={Package}
        action={<ButtonLink href={`/product/${product.slug}`} variant="secondary" size="sm" icon={<Eye size={14} />}>View public page</ButtonLink>}
      />
      <div className="relative mt-6 flex flex-wrap items-center gap-3">
        <ProductLogo product={product} size="lg" />
        <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
          {statusLabel(product.status)}
        </span>
      </div>
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Eye} value={formatCompact(product.totalViews)} label="Profile views" tone="blue" />
        <DeskStat icon={MousePointer2} value={formatCompact(product.totalQualifiedClicks)} label="Qualified clicks" tone="coral" />
        <DeskStat icon={Package} value={formatCompact(product.totalVotes)} label="Community votes" tone="mint" />
        <DeskStat icon={BarChart3} value={formatMoney(product.bidCents)} label={product.position ? `Bid · #${product.position}` : "Current bid"} tone="gold" />
      </div>
      <div className="relative mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section>
          <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
            Allocation
          </div>
          <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">Campaign heat for this listing.</h2>
          <div className="mt-4">
            {campaign ? <CampaignProgress campaign={campaign} /> : <EmptyPanel title="No campaigns for this product" body={bidBody} actionSlot={bidAction} />}
          </div>
        </section>
        <DeskPlaque tone={tone} className="self-start">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Listing</p>
          <p className="mt-4 text-sm leading-6 text-muted">{product.fullDescription}</p>
          <a href={product.websiteUrl} className="mt-6 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
            Visit website <ArrowUpRight size={13} />
          </a>
        </DeskPlaque>
      </div>
      <div className="mt-8"><ProductEditor product={product} categories={categories} /></div>
      <div className="mt-8"><ProductMembersPanel productId={product.id} initialMembers={members} /></div>
      <p className="mt-8 flex items-center gap-2 text-xs text-muted">
        <MousePointer2 size={14} className="text-coral" />
        Click tracking uses a server redirect so attribution is recorded before the visitor leaves.
      </p>
    </div>
  );
}
