import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import type { ProductStatus } from "@/lib/types";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { listOwnerProducts } from "@/lib/repositories/owner";
import { getCurrentRound } from "@/lib/repositories/catalog";
import { EmptyPanel } from "@/components/dashboard/EmptyPanel";
import { SubmitProductButton } from "@/components/submit/SubmitProductButton";
import { BidDialog } from "@/components/leaderboard/BidDialog";
import { DeskHeader, DeskStat } from "@/components/desk/DeskChrome";
import { ProductBoardBadge, ProductBoardCard } from "@/components/products/ProductBoardCard";
import { podiumStyle, type PodiumTone } from "@/components/products/product-board";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function statusTone(status: ProductStatus): PodiumTone {
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

export default async function DashboardProductsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  const [products, round] = await Promise.all([listOwnerProducts(user.id), getCurrentRound()]);
  const live = products.filter((product) => product.status === "PUBLISHED").length;
  const review = products.filter((product) => product.status === "PENDING").length;

  return (
    <div>
      <DeskHeader
        kind="owner"
        eyebrow="Launch bench"
        title="Your products on the board."
        description="Each slip is a listing you own — edit the story, start a bid, or wait for review."
        icon={Package}
        action={<SubmitProductButton variant="primary" size="sm" arrow icon={<Package size={15} />} className="self-start uppercase tracking-[0.08em]">Add a product</SubmitProductButton>}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Package} value={String(products.length)} label="On the bench" tone="coral" />
        <DeskStat icon={Package} value={String(live)} label="Live listings" tone="gold" />
        <DeskStat icon={Package} value={String(review)} label="In review" tone="blue" />
      </div>
      <div className="relative mt-8 grid gap-3">
        {products.length ? (
          products.map((product, index) => {
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
                href={`/dashboard/products/${product.id}`}
                badge={<ProductBoardBadge className={style.badge}>{statusLabel(product.status)}</ProductBoardBadge>}
                actions={
                  <>
                    {round && product.status === "PUBLISHED" ? (
                      <BidDialog productId={product.id} productName={product.name} currentBidCents={round.winningBidCents ?? product.bidCents} roundId={round.id} buttonLabel="Start a bid" buttonSize="compact" />
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">
                        {product.status === "PUBLISHED" ? "Round closed" : "Awaiting approval"}
                      </span>
                    )}
                    <ButtonLink href={`/dashboard/products/${product.id}`} variant="secondary" size="sm" arrow>
                      Open listing
                    </ButtonLink>
                  </>
                }
              />
            );
          })
        ) : (
          <EmptyPanel
            title="No products in this account yet"
            body="Listings you submit while signed in will appear here, with their votes and campaign delivery."
            actionSlot={<SubmitProductButton variant="primary" size="sm" arrow icon={<Package size={15} />} className="uppercase tracking-[0.08em]">Submit a product</SubmitProductButton>}
          />
        )}
      </div>
    </div>
  );
}
