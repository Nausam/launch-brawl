import Link from "next/link";
import { Bell, Check, Gavel, Package, Trophy } from "lucide-react";
import type { Campaign, CampaignStatus, LeaderboardRound, Notification, Product, ProductStatus } from "@/lib/types";
import { calculateCtr, cn, formatCompact, formatMoney, relativeTime } from "@/lib/utils";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ProductBoardBadge, ProductBoardCard } from "@/components/products/ProductBoardCard";
import { podiumStyle, type PodiumTone } from "@/components/products/product-board";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { CountdownTimer } from "@/components/leaderboard/CountdownTimer";
import { ButtonLink } from "@/components/ui/Button";
import { SubmitProductButton } from "@/components/submit/SubmitProductButton";

type RankTone = PodiumTone;
type NoticeTone = Notification["tone"];

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

function campaignTone(status: CampaignStatus): RankTone {
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

function rankStyle(tone: RankTone) {
  switch (tone) {
    case "gold":
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(201,148,32,.16)]",
        rail: "from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
        wash: "bg-[#fff0b5]/45",
        medal: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]",
        badge: "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]",
        ring: "border-[#e9c96b]",
        logoRing: "ring-[#f7d26e]/80",
        heat: "from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
      };
    case "silver":
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(135deg,#eef6fc_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(80,130,170,.14)]",
        rail: "from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
        wash: "bg-[#d9ecfb]/45",
        medal: "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]",
        badge: "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]",
        ring: "border-[#b9d2e6]",
        logoRing: "ring-[#d5e3ef]",
        heat: "from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
      };
    case "bronze":
      return {
        frame: "border-[#e2b189] bg-[linear-gradient(135deg,#fbeede_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(176,110,58,.14)]",
        rail: "from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
        wash: "bg-[#f6dfca]/45",
        medal: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf6,#f8e0c8,#e2b189)] text-[#9b5d2d]",
        badge: "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]",
        ring: "border-[#e2b189]",
        logoRing: "ring-[#e1ae7b]/80",
        heat: "from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
      };
    case "rest":
      return {
        frame: "border-[#d6e3ef] bg-white/80 shadow-[0_10px_24px_rgba(20,33,43,.06)]",
        rail: "from-[#e8eef4] via-[#c9d7e4] to-[#9bbdd4]",
        wash: "bg-[#eef4fa]/50",
        medal: "border-[#c9d7e4] bg-[linear-gradient(180deg,#ffffff,#eef4fa,#d6e3ef)] text-ink",
        badge: "border-line bg-paper text-muted",
        ring: "border-[#c9d7e4]",
        logoRing: "ring-[#d5e3ef]",
        heat: "from-[#e8eef4] via-[#c9d7e4] to-[#9bbdd4]",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function noticeStyle(tone: NoticeTone) {
  switch (tone) {
    case "coral":
      return "border-coral/30 bg-coral/10 text-coral";
    case "blue":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    case "green":
      return "border-[#b7d7c4] bg-[#e8f6ee] text-[#3E8E65]";
    case "neutral":
      return "border-line bg-paper text-muted";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function LaunchRow({ product, index }: { product: Product; index: number }) {
  const tone = statusTone(product.status);
  const style = podiumStyle(tone);

  return (
    <ProductBoardCard
      product={product}
      index={index}
      tone={tone}
      plaque="none"
      totals
      href={`/dashboard/products/${product.id}`}
      badge={<ProductBoardBadge className={style.badge}>{statusLabel(product.status)}</ProductBoardBadge>}
      actions={
        <ButtonLink href={`/dashboard/products/${product.id}`} variant="secondary" size="sm" arrow>
          Open listing
        </ButtonLink>
      }
    />
  );
}

function DeliveryRail({ campaign }: { campaign: Campaign }) {
  const tone = campaignTone(campaign.status);
  const style = rankStyle(tone);
  const percent = campaign.purchasedImpressions ? Math.min(100, Math.round((campaign.qualifiedImpressions / campaign.purchasedImpressions) * 100)) : 0;
  const ctr = calculateCtr(campaign.qualifiedClicks, campaign.qualifiedImpressions);

  return (
    <article className={cn("group relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 px-4 py-4 sm:px-5 sm:py-5", style.frame)}>
      <div className={cn("pointer-events-none absolute -left-16 top-1/2 h-36 w-52 -translate-y-1/2 rounded-full blur-3xl", style.wash)} />
      <div className="relative grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <span className={cn("grid h-14 w-14 place-items-center rounded-full border-2 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]", style.medal)}>
          <span className="display text-lg font-black leading-none tracking-[-0.08em]">{percent}</span>
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="display text-lg font-black tracking-[-0.03em] text-ink">{campaign.productName}</p>
            <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
              {campaignLabel(campaign.status)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{formatMoney(campaign.purchasedAmountCents)} · {formatCompact(campaign.purchasedImpressions)} allocated</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/8">
            <div className={cn("h-full rounded-full bg-gradient-to-r", style.heat)} style={{ width: `${Math.max(percent, percent > 0 ? 8 : 0)}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-muted">
            <span>{formatCompact(campaign.qualifiedImpressions)} delivered</span>
            <span className="h-1 w-1 rounded-full bg-line" />
            <span>{campaign.qualifiedClicks} clicks · {ctr.toFixed(1)}% CTR</span>
          </div>
        </div>
        <ButtonLink href={`/dashboard/campaigns/${campaign.id}`} variant="secondary" size="sm" arrow>
          Details
        </ButtonLink>
      </div>
    </article>
  );
}

function InboxRow({ item }: { item: Notification }) {
  const body = (
    <article className="relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-[#d6e3ef] bg-white/80 px-4 py-4 shadow-[0_10px_24px_rgba(20,33,43,.06)] sm:px-5">
      <div className="flex items-start gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border", noticeStyle(item.tone))}>
          {item.read ? <Check size={15} /> : <Bell size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-ink">{item.title}</p>
            {!item.read ? (
              <span className="inline-flex items-center gap-1 rounded-[12px] rounded-br-[5px] border border-coral/30 bg-coral/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-coral">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-coral" />
                New
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{item.body}</p>
          <p className="mt-2 text-[11px] font-bold text-muted">{relativeTime(item.timestamp)}</p>
        </div>
      </div>
    </article>
  );

  return item.href ? (
    <Link href={item.href} className="block transition hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}

function EmptyLane({ title, body, action }: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-10 text-center">
      <p className="text-sm font-black text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{body}</p>
      {action ? (
        <ButtonLink href={action.href} variant="primary" size="sm" arrow className="mt-5 uppercase tracking-[0.08em]">
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}

export function OwnerWorkshopBoard({
  products,
  campaigns,
  notifications,
  chartData,
  round,
  leader,
}: {
  products: Product[];
  campaigns: Campaign[];
  notifications: Notification[];
  chartData: Array<{ day: string; impressions: number; clicks: number }>;
  round?: LeaderboardRound;
  leader?: Product;
}) {
  const bench = products.slice(0, 8);
  const remainder = Math.max(0, products.length - bench.length);
  const inbox = notifications.slice(0, 5);

  return (
    <section className="relative pt-5 pb-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#e6f1fb]/55 blur-3xl" />
      </div>

      {round && leader ? (
        <section id="board" className="relative scroll-mt-24">
          <article className="relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#f8f6f1_48%,#ffffff_100%)] px-4 py-4 shadow-[0_16px_40px_rgba(201,148,32,.16)] sm:px-5 sm:py-5">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border border-[#c58a0a]/30 bg-[#f0c54a]/40 text-[#8d610f]">
                  <Trophy size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a26d08]">The Daily Brawl · live leader</p>
                  <div className="mt-1 flex items-center gap-2">
                    <ProductLogo product={leader} size="sm" />
                    <p className="truncate text-sm font-black text-ink">{leader.name}</p>
                    <span className="text-xs text-muted">#{leader.position} · {formatMoney(leader.bidCents)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-muted">
                  Ends in <CountdownTimer endsAt={round.endsAt} compact />
                </span>
                <ButtonLink href="/#daily-brawl" variant="primary" size="sm" arrow className="uppercase tracking-[0.08em]">
                  Open the board
                </ButtonLink>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section id="launches" className="relative mt-8 scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              The launch bench
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Package size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink sm:text-4xl">Your products, as they stand.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Drafts, reviews, and live listings on one bench. Status is earned by publishing — not by a paid rank.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-muted">
              {products.length} {products.length === 1 ? "listing" : "listings"}
            </span>
            <SubmitProductButton variant="primary" size="sm" arrow icon={<Package size={15} />} className="uppercase tracking-[0.08em]">
              Add a product
            </SubmitProductButton>
          </div>
        </div>
        {bench.length ? (
          <div className="mt-4 grid gap-3">
            {bench.map((product, index) => (
              <LaunchRow key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyLane title="The bench is empty" body="Submit a product to start collecting votes, bids, and campaign delivery." />
          </div>
        )}
        {remainder > 0 ? (
          <div className="mt-3 flex justify-end">
            <Link href="/dashboard/products" className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
              {remainder} more in your workspace
            </Link>
          </div>
        ) : null}
      </section>

      <section id="delivery" className="relative mt-10 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
              Delivery rails
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#4d3a14]/20 bg-[#4d3a14]/10">
                <Gavel size={13} />
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">A successful bid creates a labeled campaign. Allocation keeps delivering even if the board moves.</p>
          </div>
          <Link href="/dashboard/campaigns" className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
            All campaigns
          </Link>
        </div>
        {campaigns.length ? (
          <div className="mt-4 grid gap-3">
            {campaigns.map((campaign) => (
              <DeliveryRail key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyLane title="No campaigns yet" body="A successful bid creates a labeled campaign with a measurable impression allocation." action={{ href: "/#daily-brawl", label: "Open the live board" }} />
          </div>
        )}
      </section>

      <section id="reach" className="relative mt-10 scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">
              Signal week
            </div>
            <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink">Reach over time.</h2>
          </div>
          <Link href="/dashboard/campaigns" className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
            Full analytics
          </Link>
        </div>
        {chartData.length ? (
          <div className="mt-4 overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-[#d6e3ef] bg-white/80 px-3 py-4 shadow-[0_10px_24px_rgba(20,33,43,.06)] sm:px-5">
            <AnalyticsChart data={chartData} />
            <div className="mt-2 flex gap-5 px-2 text-xs text-muted">
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-coral" />Impressions</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-navy" />Clicks</span>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyLane title="No delivery plotted yet" body="Campaign events appear here after qualified impressions or clicks are recorded." />
          </div>
        )}
      </section>

      <section id="inbox" className="relative mt-10 scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              Owner inbox
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-line bg-paper-strong">
                <Bell size={13} />
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">Challenges, bids, and Brawl results for this signed-in account.</p>
          </div>
          <Link href="/dashboard/notifications" className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
            All notifications
          </Link>
        </div>
        {inbox.length ? (
          <div className="mt-4 grid gap-3">
            {inbox.map((item) => (
              <InboxRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyLane title="Inbox is quiet" body="Bids, campaign delivery, and Brawl results will show up here for this account." />
          </div>
        )}
      </section>

      <div className="relative mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5 text-xs text-muted">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-coral" />Paid reach stays labeled. Organic votes stay separate.</span>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/dashboard/products" variant="secondary" size="sm" arrow>Manage products</ButtonLink>
          <ButtonLink href="/dashboard/bids" variant="secondary" size="sm" arrow>Bid history</ButtonLink>
          <ButtonLink href="/dashboard/settings" variant="secondary" size="sm" arrow>Account settings</ButtonLink>
        </div>
      </div>
    </section>
  );
}
