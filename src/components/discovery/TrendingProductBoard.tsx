import { Flame } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductBoardCard } from "@/components/products/ProductBoardCard";

function heatScore(product: Product) {
  return (product.organicQualifiedClicks ?? 0) + (product.organicFavorites ?? 0) * 2 + (product.organicVotes ?? product.totalVotes);
}

function heatPercent(score: number, maxScore: number) {
  if (maxScore <= 0 || score <= 0) return 0;
  return Math.max(8, Math.round((score / maxScore) * 100));
}

export function TrendingProductBoard({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const maxScore = Math.max(0, ...products.map(heatScore));

  return (
    <section className="relative overflow-hidden pt-5 pb-14 lg:pt-6 lg:pb-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-16 h-80 w-80 rounded-full bg-[#ffd8cc]/40 blur-3xl" />
      <PageContainer className="relative py-0 lg:py-0">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              The heat ladder
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Flame size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">Every launch with momentum.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Organic clicks, votes, and saves stack into live heat. Rank is earned, not bought.</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-xs font-bold text-muted sm:self-end">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" />
            {products.length} launches in motion
          </span>
        </div>

        {products.length ? (
          <div className="relative mt-8 grid gap-3">
            {products.map((product, index) => (
              <ProductBoardCard
                key={product.id}
                product={product}
                category={categoryById.get(product.categoryId)}
                index={index}
                heat={heatPercent(heatScore(product), maxScore)}
              />
            ))}
          </div>
        ) : (
          <div className="relative mt-8 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
            <div className="eyebrow text-coral">No signal yet</div>
            <p className="mt-3 text-lg font-bold text-ink">The board is waiting for its first launch signal.</p>
            <p className="mt-2 text-sm text-muted">Be the first product to put something new on the ladder.</p>
          </div>
        )}

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5 text-xs text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d8a52b]" />Heat is earned from organic clicks, votes, and saves</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-coral" />Paid reach stays off this ladder</span>
        </div>
      </PageContainer>
    </section>
  );
}
