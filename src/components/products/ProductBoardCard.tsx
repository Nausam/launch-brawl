import Link from "next/link";
import { Check, Heart, Minus, MousePointer2, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import type { Category, Product, ProductTrend } from "@/lib/types";
import { findCategory } from "@/lib/repositories/catalog";
import { cn, formatCompact } from "@/lib/utils";
import { ImpressionTracker } from "@/components/analytics/ImpressionTracker";
import type { ActionButtonVariant } from "@/components/products/ProductActions";
import { VoteControl, FavoriteControl } from "@/components/products/ProductActionControls";
import { launchPlaqueDate, podiumStyle, podiumTone, type PodiumStyle, type PodiumTone, type ProductBoardPlaque } from "@/components/products/product-board";
import { LiveCount } from "@/components/products/product-engagement";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ButtonLink } from "@/components/ui/Button";

export type ProductBoardAccent = "bar" | "rail" | "none";

export type ProductBoardImpression = {
  campaignId: string;
  trackingToken: string;
  placement: string;
  page: string;
};

function trendCopy(trend: ProductTrend) {
  switch (trend) {
    case "up":
      return "Rising signal";
    case "down":
      return "Cooling signal";
    case "new":
      return "New signal";
    case "flat":
      return "Holding steady";
    default: {
      const _exhaustive: never = trend;
      return _exhaustive;
    }
  }
}

function TrendIcon({ trend }: { trend: ProductTrend }) {
  switch (trend) {
    case "up":
      return <TrendingUp size={14} />;
    case "down":
      return <TrendingDown size={14} />;
    case "new":
      return <Sparkles size={14} />;
    case "flat":
      return <Minus size={14} />;
    default: {
      const _exhaustive: never = trend;
      return _exhaustive;
    }
  }
}

export function ProductBoardBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", className)}>
      {children}
    </span>
  );
}

export function ProductBoardTrendBadge({ trend, className }: { trend: ProductTrend; className?: string }) {
  return (
    <ProductBoardBadge className={className}>
      <TrendIcon trend={trend} />
      {trendCopy(trend)}
    </ProductBoardBadge>
  );
}

function DefaultStats({
  productId,
  clicks,
  favorites,
  heat,
  style,
}: {
  productId: string;
  clicks: number;
  favorites: number;
  heat?: number;
  style: PodiumStyle;
}) {
  if (typeof heat === "number") {
    return (
      <div className="w-full max-w-[220px]">
        <div className="flex items-end justify-between gap-3">
          <p className={cn("text-[10px] font-black uppercase tracking-[0.14em]", style.heatLabel)}>Live heat</p>
          <p className={cn("display text-2xl font-black leading-none", style.rank)}>{heat}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8">
          <div className={cn("h-full rounded-full", style.heat)} style={{ width: `${heat}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted">
          <span className="inline-flex items-center gap-1">
            <MousePointer2 size={13} />
            {formatCompact(clicks)} clicks
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart size={13} />
            <LiveCount kind="favorites" productId={productId} initial={favorites} /> saves
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div>
        <p className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em]", style.stat)}>
          <MousePointer2 size={13} /> Clicks
        </p>
        <p className="display mt-1 text-2xl font-black leading-none text-ink">{formatCompact(clicks)}</p>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#a66d00]">
          <Heart size={13} /> Favorites
        </p>
        <p className="display mt-1 text-2xl font-black leading-none text-ink">
          <LiveCount kind="favorites" productId={productId} initial={favorites} />
        </p>
      </div>
    </div>
  );
}

function BoardPlaque({
  plaque,
  index,
  launchDate,
  style,
}: {
  plaque: ProductBoardPlaque;
  index?: number;
  launchDate: string;
  style: PodiumStyle;
}) {
  const shell = cn("grid h-16 w-16 shrink-0 place-content-center self-center rounded-[16px] rounded-br-[7px] border", style.plaque);
  switch (plaque) {
    case "date": {
      const date = launchPlaqueDate(launchDate);
      return (
        <span className={shell} aria-label={`Launched ${date.month} ${date.day}`}>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">{date.month}</span>
          <span className="display text-2xl font-black leading-none tracking-[-0.08em]">{date.day}</span>
        </span>
      );
    }
    case "rank":
      if (typeof index !== "number") return null;
      return (
        <span className={cn(shell, "display place-items-center text-2xl font-black leading-none tracking-[-0.08em]")}>
          {String(index + 1).padStart(2, "0")}
        </span>
      );
    case "none":
      return null;
    default: {
      const _exhaustive: never = plaque;
      return _exhaustive;
    }
  }
}

export async function ProductBoardCard({
  product,
  category,
  index,
  tone,
  accent = "none",
  plaque = "rank",
  leading,
  badge,
  sponsored = false,
  impression,
  href,
  meta,
  stats,
  actions,
  heat,
  totals = false,
  actionVariant = "plaque",
  className,
  palette,
}: {
  product: Product;
  category?: Category;
  index?: number;
  tone?: PodiumTone;
  accent?: ProductBoardAccent;
  plaque?: ProductBoardPlaque;
  leading?: ReactNode;
  badge?: ReactNode;
  sponsored?: boolean;
  impression?: ProductBoardImpression;
  href?: string;
  meta?: ReactNode;
  stats?: ReactNode | null;
  actions?: ReactNode;
  heat?: number;
  totals?: boolean;
  actionVariant?: ActionButtonVariant;
  className?: string;
  palette?: Partial<PodiumStyle>;
}) {
  const resolvedCategory = category ?? (await findCategory(product.categoryId));
  const resolvedTone = tone ?? (typeof index === "number" ? podiumTone(index) : "rest");
  const style = { ...podiumStyle(resolvedTone), ...palette };
  const applyPodiumFrame = tone !== undefined || typeof index === "number" || !className;
  const rankLeading = leading ?? <BoardPlaque plaque={plaque} index={index} launchDate={product.launchDate} style={style} />;
  const productHref = href ?? `/product/${product.slug}`;
  const useTotals = sponsored || totals;
  const clicks = useTotals ? product.totalQualifiedClicks : product.organicQualifiedClicks ?? 0;
  const favorites = useTotals ? product.totalFavorites : product.organicFavorites ?? 0;
  const votes = product.organicVotes ?? product.totalVotes;

  return (
    <article className={cn("group relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 px-4 py-4 sm:px-5 sm:py-5", applyPodiumFrame && style.frame, className)}>
      {impression ? (
        <ImpressionTracker
          campaignId={impression.campaignId}
          productId={product.id}
          placement={impression.placement}
          page={impression.page}
          trackingToken={impression.trackingToken}
        />
      ) : null}
      {accent === "bar" ? <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1", style.bar)} /> : null}
      {accent === "rail" ? <div className={cn("pointer-events-none absolute inset-y-0 left-0 w-1.5", style.rail)} /> : null}
      <div className={cn("relative flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6", accent === "rail" && "pl-2")}>
        {rankLeading}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link href={productHref} className="relative grid h-16 w-16 shrink-0 place-items-center self-center">
            <span className={cn("pointer-events-none absolute -inset-1.5 rounded-full border border-dashed opacity-70", style.ring)} />
            <span className={cn("h-16 w-16 overflow-hidden rounded-full border-2 border-white ring-1", style.logoRing)}>
              <ProductLogo product={product} size="lg" className="!h-full !w-full !rounded-full border-0 shadow-none" />
            </span>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={productHref} className="display text-xl font-black tracking-[-0.03em] text-ink transition group-hover:text-coral">
                {product.name}
              </Link>
              {product.verified ? (
                <span className="grid h-5 w-5 place-items-center rounded-[8px] rounded-br-[3px] bg-navy text-white" aria-label="Verified product">
                  <Check size={12} />
                </span>
              ) : null}
              {badge ?? <ProductBoardTrendBadge trend={product.trend} className={style.badge} />}
              {sponsored ? (
                <span className="rounded-[10px] rounded-br-[4px] border border-coral/30 bg-coral/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-coral">Sponsored</span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{product.shortDescription}</p>
            {meta ?? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted">
                <span>{resolvedCategory?.name ?? "Other"}</span>
                <span className="h-1 w-1 rounded-full bg-line" />
                <span>{product.pricingType}</span>
                <span className="h-1 w-1 rounded-full bg-line" />
                <span>by {product.makerName}</span>
              </div>
            )}
          </div>
        </div>
        {stats === null ? null : (
          <div className={cn("flex items-center gap-6 border-t border-dashed pt-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0", style.rule)}>
            {stats ?? (
              <DefaultStats productId={product.id} clicks={clicks} favorites={favorites} heat={heat} style={style} />
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
          {actions ?? (
            <>
              <div className="flex items-center gap-2">
                <VoteControl productId={product.id} initialVotes={votes} buttonVariant={actionVariant} />
                <FavoriteControl productId={product.id} initialFavorites={favorites} buttonVariant={actionVariant} />
              </div>
              <ButtonLink href={productHref} variant="secondary" size="sm" arrow>
                View launch
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
