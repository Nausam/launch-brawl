import { Flame } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { findCategory } from "@/lib/repositories/catalog";
import { ProductBoardCard } from "@/components/products/ProductBoardCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { ButtonLink } from "@/components/ui/Button";

export async function TrendingMomentum({
  products,
  limit = 3,
  title = "The signal is moving.",
  description = "Community engagement, qualified clicks, favorites, and recency surface the launches people are choosing right now.",
  showLink = true,
  linkHref = "/trending",
  linkLabel = "See all momentum",
}: {
  products: Product[];
  limit?: number;
  title?: string;
  description?: string;
  showLink?: boolean;
  linkHref?: string;
  linkLabel?: string;
}) {
  const entries = await Promise.all(
    products.slice(0, limit).map(async (product) => ({ product, category: await findCategory(product.categoryId) })),
  );

  return (
    <section className="noise relative overflow-hidden border-y border-line bg-paper-strong/25">
      <div className="pointer-events-none absolute -right-36 top-10 h-80 w-80 rounded-full border-[34px] border-[#eaf3fb]" />
      <div className="pointer-events-none absolute -left-40 bottom-[-12rem] h-96 w-96 rounded-full border-[42px] border-[#fff0c8]/70" />
      <PageContainer className="relative py-14 lg:py-20">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              Organic momentum
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Flame size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">{title}</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted">{description}</p>
          </div>
          {showLink ? (
            <ButtonLink href={linkHref} variant="secondary" size="lg" arrow className="self-start sm:self-end">
              {linkLabel}
            </ButtonLink>
          ) : null}
        </div>

        {entries.length ? (
          <div className="relative mt-7 grid gap-3">
            {entries.map(({ product, category }, index) => (
              <ProductBoardCard key={product.id} product={product} category={category} index={index} />
            ))}
          </div>
        ) : (
          <div className="relative mt-7 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
            <div className="eyebrow text-coral">No signal yet</div>
            <p className="mt-3 text-lg font-bold text-ink">The first launches will set the pace.</p>
            <p className="mt-2 text-sm text-muted">Be the first to put a product on the board.</p>
          </div>
        )}
      </PageContainer>
    </section>
  );
}
