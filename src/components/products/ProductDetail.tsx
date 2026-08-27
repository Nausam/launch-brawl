import Link from "next/link";
import type { ReactNode } from "react";
import { Bookmark, CalendarDays, ExternalLink, Heart, MousePointer2, Sparkles, Users, type LucideIcon } from "lucide-react";
import type { AppUser, PricingType, Product, ProductLaunchEvent, ProductSocialLinks, ProductTrend } from "@/lib/types";
import { cn, formatCompact } from "@/lib/utils";
import { findCategory, getCurrentRound, getProductLaunchEvent } from "@/lib/repositories/catalog";
import { findUserById } from "@/lib/repositories/competitive";
import { listOwnerProducts } from "@/lib/repositories/owner";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { findActiveCampaignForProduct } from "@/lib/repositories/engagement";
import { publicAppUrl } from "@/lib/server/runtime";
import { createCampaignTrackingToken } from "@/lib/server/campaign-attribution";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ProductBoardCard } from "@/components/products/ProductBoardCard";
import { VoteControl, FavoriteControl } from "@/components/products/ProductActionControls";
import { LiveCount } from "@/components/products/product-engagement";
import { CompetitiveProductPanel } from "@/components/products/CompetitiveProductPanel";
import { ChallengeDialog } from "@/components/brawls/ChallengeDialog";
import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import { ButtonLink } from "@/components/ui/Button";
import { ShareProductButton } from "@/components/products/ShareProductButton";
import { ClaimProductButton } from "@/components/products/ClaimProductButton";
import { PageContainer } from "@/components/layout/PageContainer";

type RankTone = "gold" | "silver" | "bronze" | "rest";
type ExhibitStatTone = "coral" | "gold" | "blue" | "mint";
type SocialNetwork = keyof ProductSocialLinks;
type LaunchEventType = NonNullable<ProductLaunchEvent["eventType"]>;
type LaunchEventStatus = ProductLaunchEvent["status"];
type OwnershipStatus = NonNullable<Product["ownershipStatus"]>;

function rankStyle(tone: RankTone) {
  switch (tone) {
    case "gold":
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf6,#ffffff)] shadow-[2px_2px_0_#e4c15a]",
        medal: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]",
        badge: "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]",
        wash: "bg-[#fff0b5]/45",
      };
    case "silver":
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(180deg,#f7fbfe,#ffffff)] shadow-[2px_2px_0_#b7cfe0]",
        medal: "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]",
        badge: "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]",
        wash: "bg-[#d9ecfb]/45",
      };
    case "bronze":
      return {
        frame: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf5,#ffffff)] shadow-[2px_2px_0_#e2b189]",
        medal: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf6,#f8e0c8,#e2b189)] text-[#9b5d2d]",
        badge: "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]",
        wash: "bg-[#f6dfca]/45",
      };
    case "rest":
      return {
        frame: "border-line bg-white shadow-[2px_2px_0_#e5e2da]",
        medal: "border-[#c9d7e4] bg-[linear-gradient(180deg,#ffffff,#eef4fa,#d6e3ef)] text-ink",
        badge: "border-line bg-paper text-muted",
        wash: "bg-[#eef4fa]/50",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function exhibitStatStyle(tone: ExhibitStatTone) {
  switch (tone) {
    case "coral":
      return {
        frame: "border-coral-dark bg-coral text-white shadow-[0_12px_28px_rgba(255,107,74,.28)]",
        value: "text-white",
        label: "text-white/80",
        tile: "border-white/30 bg-white/15 text-white",
      };
    case "gold":
      return {
        frame: "border-[#c58a0a] bg-[linear-gradient(180deg,#fff8df,#fff1b8)] text-[#7f570b] shadow-[0_12px_28px_rgba(201,148,32,.2)]",
        value: "text-[#7f570b]",
        label: "text-[#a26d08]",
        tile: "border-[#c58a0a]/30 bg-[#f0c54a]/40 text-[#8d610f]",
      };
    case "blue":
      return {
        frame: "border-ink bg-paper text-ink shadow-[0_10px_24px_rgba(20,33,43,.1)]",
        value: "text-ink",
        label: "text-[#2c668e]",
        tile: "border-ink/20 bg-[#eaf3fb] text-[#2c668e]",
      };
    case "mint":
      return {
        frame: "border-[#2f6f50] bg-[#e8f6ee] text-[#245c42] shadow-[0_12px_28px_rgba(62,142,101,.16)]",
        value: "text-[#245c42]",
        label: "text-[#3E8E65]",
        tile: "border-[#3E8E65]/25 bg-white/70 text-[#3E8E65]",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function ExhibitStat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: ReactNode; label: string; tone: ExhibitStatTone }) {
  const style = exhibitStatStyle(tone);
  return (
    <div className={cn("inline-flex min-h-12 min-w-[168px] items-center justify-between gap-3 rounded-[16px] rounded-br-[7px] border px-3 py-2", style.frame)}>
      <span className="pl-1 text-left">
        <span className={cn("display block text-2xl font-black leading-none tracking-[-0.04em]", style.value)}>{value}</span>
        <span className={cn("mt-1 block text-[10px] font-black uppercase tracking-[0.16em]", style.label)}>{label}</span>
      </span>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border", style.tile)}>
        <Icon size={15} />
      </span>
    </div>
  );
}

function trendLabel(trend: ProductTrend) {
  switch (trend) {
    case "up":
      return "Rising";
    case "down":
      return "Cooling";
    case "new":
      return "New on the board";
    case "flat":
      return "Holding";
    default: {
      const _exhaustive: never = trend;
      return _exhaustive;
    }
  }
}

function trendTone(trend: ProductTrend): RankTone {
  switch (trend) {
    case "up":
      return "gold";
    case "down":
      return "bronze";
    case "new":
      return "rest";
    case "flat":
      return "silver";
    default: {
      const _exhaustive: never = trend;
      return _exhaustive;
    }
  }
}

function pricingLabel(pricing: PricingType) {
  switch (pricing) {
    case "Free":
      return "Free";
    case "Freemium":
      return "Freemium";
    case "Paid":
      return "Paid";
    case "Open source":
      return "Open source";
    default: {
      const _exhaustive: never = pricing;
      return _exhaustive;
    }
  }
}

function socialLabel(network: SocialNetwork) {
  switch (network) {
    case "x":
      return "X";
    case "github":
      return "GitHub";
    case "linkedin":
      return "LinkedIn";
    case "discord":
      return "Discord";
    case "youtube":
      return "YouTube";
    default: {
      const _exhaustive: never = network;
      return _exhaustive;
    }
  }
}

function eventTypeLabel(type: LaunchEventType | undefined) {
  switch (type) {
    case "DEMO":
      return "Live demo";
    case "WEBINAR":
      return "Community event";
    case "RELEASE":
      return "Release moment";
    case "LAUNCH":
      return "Launch event";
    case undefined:
      return "Launch event";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function eventStatusLabel(status: LaunchEventStatus) {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";
    case "LIVE":
      return "Live now";
    case "COMPLETED":
      return "Completed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function eventStatusTone(status: LaunchEventStatus): RankTone {
  switch (status) {
    case "LIVE":
      return "gold";
    case "SCHEDULED":
      return "silver";
    case "COMPLETED":
      return "rest";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function ownershipLabel(status: OwnershipStatus) {
  switch (status) {
    case "VERIFIED":
      return "Verified listing";
    case "PENDING":
      return "Claim in review";
    case "UNCLAIMED":
      return "Unclaimed listing";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function LaunchMoment({ event }: { event: ProductLaunchEvent }) {
  const tone = eventStatusTone(event.status);
  const style = rankStyle(tone);
  return (
    <article className={cn("relative rounded-[17px] rounded-br-[8px] border px-4 py-4 sm:px-5 sm:py-5", style.frame)}>
      <div className="relative flex items-start gap-3">
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border", style.medal)}>
          <CalendarDays size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">{eventTypeLabel(event.eventType)}</p>
            <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
              {eventStatusLabel(event.status)}
            </span>
          </div>
          {event.tagline ? <p className="mt-2 text-sm font-black text-ink">{event.tagline}</p> : null}
          {event.eventAt ? <p className="mt-1 text-xs text-muted">{new Date(event.eventAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p> : null}
          {event.eventUrl ? (
            <a href={event.eventUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
              Open event
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const socialKeys: SocialNetwork[] = ["x", "github", "linkedin", "discord", "youtube"];

const exhibitJumps = [
  { key: "story", label: "The brief" },
  { key: "record", label: "Season card" },
  { key: "placement", label: "Arena" },
  { key: "makers", label: "Credits" },
  { key: "nearby", label: "Nearby" },
] as const;

export async function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const [category, round, user, campaignId, makers, launchEvent] = await Promise.all([
    findCategory(product.categoryId),
    getCurrentRound(),
    getCurrentAppUser(),
    findActiveCampaignForProduct(product.id),
    Promise.all([...new Set([product.ownerId, ...(product.makerIds ?? [])])].filter(Boolean).slice(0, 20).map(findUserById)),
    getProductLaunchEvent(product.id),
  ]);
  const campaignPlacement = "product-profile";
  const campaignPage = "product-profile";
  const trackingToken = campaignId ? createCampaignTrackingToken({ campaignId, productId: product.id, placement: campaignPlacement, page: campaignPage }) : "";
  const challengerProducts = user ? await listOwnerProducts(user.id) : [];
  const shareUrl = `${publicAppUrl() || ""}/product/${product.slug}`;
  const goHref = `/go/${product.id}?placement=${campaignPlacement}&page=${campaignPage}${campaignId && trackingToken ? `&campaignId=${encodeURIComponent(campaignId)}&trackingToken=${encodeURIComponent(trackingToken)}` : ""}`;
  const namedMakers = makers.filter((maker): maker is AppUser => Boolean(maker));
  const event = launchEvent ?? (product.launchMetadata ? { id: product.id, productId: product.id, status: "SCHEDULED" as const, ...product.launchMetadata } : undefined);
  const rising = rankStyle(trendTone(product.trend));
  const jumps = exhibitJumps.filter((jump) => jump.key !== "nearby" || related.length > 0);

  return (
    <>
      <ProductViewTracker productId={product.id} />
      <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -left-[28%] -top-52 h-[500px] w-[156%] rounded-[50%] border-[18px] border-[#eef3f8]" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full border-[32px] border-coral/10" />
        <PageContainer className="relative pt-14 pb-3 lg:pt-20 lg:pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
                  On the exhibit floor
                  <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                    <Sparkles size={13} />
                  </span>
                </div>
                {product.verified ? (
                  <span className="inline-flex items-center rounded-[12px] rounded-br-[5px] border border-[#b7cfe0] bg-[#eef6fc] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#355875]">
                    Verified maker
                  </span>
                ) : null}
                {product.featured ? (
                  <span className="inline-flex items-center rounded-[12px] rounded-br-[5px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#4d3a14]">
                    Featured
                  </span>
                ) : null}
                <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", rising.badge)}>
                  {trendLabel(product.trend)}
                </span>
              </div>
              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <div className="pointer-events-none absolute -inset-2 rounded-[28px] border border-dashed border-[#e4c15a]/70" />
                  <ProductLogo product={product} size="xl" className="border-2 border-white shadow-none ring-1 ring-[#f7d26e]/80" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">
                    {category?.name ?? "Uncategorized"} · launched {new Date(product.launchDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <h1 className="display mt-2 max-w-3xl text-4xl font-black leading-[.95] tracking-[-0.05em] text-ink sm:text-6xl lg:text-7xl">{product.name}</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">{product.shortDescription}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 self-start">
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href={goHref} variant="secondary" size="md" className="pr-1.5 shadow-[2px_2px_0_#14212b]">
                  Visit {product.name}
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 bg-paper-strong text-ink transition group-hover:bg-ink group-hover:text-white">
                    <ExternalLink size={14} strokeWidth={2.5} />
                  </span>
                </ButtonLink>
                <ChallengeDialog
                  challengedProductId={product.id}
                  challengedProductName={product.name}
                  signedIn={Boolean(user)}
                  challengerProducts={challengerProducts.map((item) => ({ id: item.id, name: item.name, status: item.status }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <VoteControl productId={product.id} initialVotes={product.organicVotes ?? product.totalVotes} />
                <FavoriteControl productId={product.id} initialFavorites={product.organicFavorites ?? product.totalFavorites ?? 0} />
                <ShareProductButton name={product.name} url={shareUrl} />
              </div>
            </div>
          </div>

          <div className="relative mt-7 flex flex-wrap gap-3">
            <ExhibitStat icon={Heart} value={<LiveCount kind="votes" productId={product.id} initial={product.organicVotes ?? product.totalVotes} />} label="Community votes" tone="coral" />
            <ExhibitStat icon={Bookmark} value={<LiveCount kind="favorites" productId={product.id} initial={product.organicFavorites ?? product.totalFavorites ?? 0} />} label="Favorites" tone="blue" />
            <ExhibitStat icon={MousePointer2} value={formatCompact(product.organicQualifiedClicks ?? 0)} label="Organic clicks" tone="gold" />
            <ExhibitStat icon={Users} value={formatCompact(product.organicViews ?? 0)} label="Organic views" tone="mint" />
            <ExhibitStat icon={Sparkles} value={pricingLabel(product.pricingType)} label="Pricing" tone="blue" />
          </div>

          <div className="relative mt-7 flex items-center gap-3">
            <div className="scrollbar-hide min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex w-max gap-2">
                {jumps.map((jump, index) => (
                  <Link
                    key={jump.key}
                    href={`#${jump.key}`}
                    className={cn(
                      "shrink-0 rounded-[14px] rounded-br-[6px] border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition",
                      index === 0 ? "border-ink bg-ink text-white" : "border-line bg-paper text-muted hover:border-ink hover:text-ink",
                    )}
                  >
                    {jump.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="relative overflow-hidden pt-5 pb-14 lg:pt-6 lg:pb-16">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#e6f1fb]/55 blur-3xl" />
        <PageContainer className="relative py-0 lg:py-0">
          {product.coverImageUrl ? (
            <div className="overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-[#d6e3ef] bg-paper-strong/45">
              <img src={product.coverImageUrl} alt={`${product.name} cover`} className="max-h-[420px] w-full object-cover" />
            </div>
          ) : null}

          {event ? (
            <div className={cn(product.coverImageUrl ? "mt-4" : "")}>
              <LaunchMoment event={event} />
            </div>
          ) : null}

          <section id="story" className="mt-10 scroll-mt-24">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              The brief
            </div>
            <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink sm:text-4xl">What this launch is for.</h2>
            <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-8 text-ink/80">{product.fullDescription}</p>
            {product.tags.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-[12px] rounded-br-[5px] border border-line bg-paper px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <CompetitiveProductPanel product={product} round={round} />

          <section id="makers" className="mt-10 scroll-mt-24">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
                  Credits
                </div>
                <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink">Who put this on the board.</h2>
              </div>
              {category ? (
                <Link href={`/category/${product.categoryId}`} className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
                  More in {category.name}
                </Link>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {namedMakers.length ? (
                namedMakers.map((maker) => (
                  <Link
                    key={maker.id}
                    href={`/profile/${maker.username}`}
                    className="inline-flex items-center rounded-[16px] rounded-br-[7px] border-2 border-[#d6e3ef] bg-white/80 px-4 py-2 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:border-ink"
                  >
                    {maker.displayName}
                  </Link>
                ))
              ) : (
                <span className="inline-flex items-center rounded-[16px] rounded-br-[7px] border-2 border-[#d6e3ef] bg-white/80 px-4 py-2 text-sm font-black text-ink">{product.makerName}</span>
              )}
              <span className="inline-flex items-center rounded-[12px] rounded-br-[5px] border border-line bg-paper px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted">
                {product.makerCount && product.makerCount > 1 ? `${product.makerCount} makers` : "Independent maker"}
              </span>
              {product.ownershipStatus ? (
                <span className="inline-flex items-center rounded-[12px] rounded-br-[5px] border border-line bg-paper px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted">
                  {ownershipLabel(product.ownershipStatus)}
                </span>
              ) : null}
            </div>
            {product.socialLinks ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {socialKeys.map((network) => {
                  const href = product.socialLinks?.[network];
                  if (!href) return null;
                  return (
                    <a
                      key={network}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted transition hover:border-ink hover:text-ink"
                    >
                      {socialLabel(network)}
                      <ExternalLink size={12} />
                    </a>
                  );
                })}
              </div>
            ) : null}
            {user && user.id !== product.ownerId ? <ClaimProductButton productId={product.id} /> : null}
          </section>

          {related.length ? (
            <section id="nearby" className="mt-10 scroll-mt-24">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">
                    Nearby on the floor
                  </div>
                  <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink">Other launches in this corner.</h2>
                </div>
                <Link href="/discover" className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
                  Explore everything
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {related.map((item, index) => (
                  <ProductBoardCard key={item.id} product={item} index={index} />
                ))}
              </div>
            </section>
          ) : null}
        </PageContainer>
      </section>
    </>
  );
}
