import { Compass, Flame, Sparkles } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { findActiveCampaignForProduct } from "@/lib/repositories/engagement";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductBoardCard, type ProductBoardImpression } from "@/components/products/ProductBoardCard";
import { createCampaignTrackingToken } from "@/lib/server/campaign-attribution";

async function sponsoredImpression(product: Product): Promise<ProductBoardImpression | undefined> {
  const campaignId = await findActiveCampaignForProduct(product.id);
  if (!campaignId) return undefined;
  return {
    campaignId,
    trackingToken: createCampaignTrackingToken({ campaignId, productId: product.id, placement: "sponsored-discovery", page: "discover" }),
    placement: "sponsored-discovery",
    page: "discover",
  };
}

export async function DiscoverProductBoard({
  products,
  sponsoredProducts = [],
  categories,
  categoryName,
}: {
  products: Product[];
  sponsoredProducts?: Product[];
  categories: Category[];
  categoryName?: string;
}) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const sponsoredImpressions = await Promise.all(sponsoredProducts.map(sponsoredImpression));

  return (
    <section className="relative overflow-hidden pt-5 pb-14 lg:pt-6 lg:pb-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-16 h-80 w-80 rounded-full bg-[#e6f1fb]/55 blur-3xl" />
      <PageContainer className="relative py-0 lg:py-0">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              The live directory
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Compass size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">{categoryName ? `${categoryName} signal.` : "Choose your next signal."}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Sponsored placements are labeled. Organic momentum stays visible beside them.</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-xs font-bold text-muted sm:self-end">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" />
            {sponsoredProducts.length + products.length} launches in this view
          </span>
        </div>

        {sponsoredProducts.length ? (
          <div className="relative mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
                  Sponsored reach
                  <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#4d3a14]/20 bg-[#4d3a14]/10">
                    <Flame size={13} />
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">Paid positions stay separate from the organic signal below.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {sponsoredProducts.map((product, index) => (
                <ProductBoardCard
                  key={`sponsored-${product.id}`}
                  product={product}
                  category={categoryById.get(product.categoryId)}
                  index={index}
                  sponsored
                  impression={sponsoredImpressions[index]}
                />
              ))}
            </div>
          </div>
        ) : null}

        {products.length ? (
          <div className="relative mt-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">
                Organic signal
                <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#355875]/20 bg-[#355875]/10">
                  <Sparkles size={13} />
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">Ranked from community activity, recent discovery, and launch momentum.</p>
            </div>
            <div className="mt-4 grid gap-3">
              {products.map((product, index) => (
                <ProductBoardCard
                  key={product.id}
                  product={product}
                  category={categoryById.get(product.categoryId)}
                  index={index}
                />
              ))}
            </div>
          </div>
        ) : !sponsoredProducts.length ? (
          <div className="relative mt-8 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
            <div className="eyebrow text-coral">No signal yet</div>
            <p className="mt-3 text-lg font-bold text-ink">The directory is waiting for its first launch.</p>
            <p className="mt-2 text-sm text-muted">Be the first product to put something new on the board.</p>
          </div>
        ) : null}

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5 text-xs text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d8a52b]" />Sponsored rank is paid and labeled</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#75a8cf]" />Organic signal is earned</span>
        </div>
      </PageContainer>
    </section>
  );
}
