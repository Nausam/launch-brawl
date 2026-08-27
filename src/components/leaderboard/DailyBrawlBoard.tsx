import Link from "next/link";
import { ArrowDown, ArrowUp, Crown, Medal, Minus, MousePointer2, ShieldCheck, Sparkles, Swords, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { LeaderboardRound, Product } from "@/lib/types";
import { cn, formatCompact, formatMoney } from "@/lib/utils";
import { BidDialog } from "@/components/leaderboard/BidDialog";
import { CountdownTimer } from "@/components/leaderboard/CountdownTimer";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ButtonLink } from "@/components/ui/Button";

type BoardTone = "gold" | "silver" | "bronze";

function boardStyle(tone: BoardTone) {
  switch (tone) {
    case "gold":
      return {
        frame: "border-[#e4c15a] bg-white shadow-[0_18px_40px_rgba(201,148,32,.16)]",
        cap: "bg-[linear-gradient(180deg,#fffdf4_0%,#ffe8a8_48%,#f5d36a_100%)] text-[#7f570b]",
        star: "text-[#c18b1e]",
        badge: "border-[#f4c788] bg-[#fff4d6] text-[#c24b2a]",
        logoRing: "ring-[#f7d26e]/80",
        stat: "text-[#a26d08]",
        live: "Live leader",
      };
    case "silver":
      return {
        frame: "border-[#b7cfe0] bg-white shadow-[0_16px_36px_rgba(80,130,170,.12)]",
        cap: "bg-[linear-gradient(180deg,#fbfdff_0%,#eef6fc_48%,#c7dced_100%)] text-[#355875]",
        star: "text-[#6f97b4]",
        badge: "border-[#c5d8e8] bg-[#eef6fc] text-[#355875]",
        logoRing: "ring-[#d5e3ef]",
        stat: "text-[#40698c]",
        live: "Chasing #1",
      };
    case "bronze":
      return {
        frame: "border-[#e2b189] bg-white shadow-[0_16px_36px_rgba(176,110,58,.12)]",
        cap: "bg-[linear-gradient(180deg,#fffaf6_0%,#f8e0c8_48%,#e2b189_100%)] text-[#9b5d2d]",
        star: "text-[#b56a38]",
        badge: "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]",
        logoRing: "ring-[#e1ae7b]/80",
        stat: "text-[#a86636]",
        live: "In the hunt",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function podiumSlot(tone: BoardTone) {
  switch (tone) {
    case "gold":
      return "lg:col-start-2 lg:row-start-1 lg:min-h-[29rem]";
    case "silver":
      return "lg:col-start-1 lg:row-start-1 lg:min-h-[25.5rem]";
    case "bronze":
      return "lg:col-start-3 lg:row-start-1 lg:min-h-[24rem]";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function RankIcon({ tone }: { tone: BoardTone }) {
  let icon: ReactNode;
  switch (tone) {
    case "gold":
      icon = <Crown size={15} fill="currentColor" />;
      break;
    case "silver":
    case "bronze":
      icon = <Medal size={15} />;
      break;
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
  return icon;
}

function Movement({ product, compact = false }: { product: Product; compact?: boolean }) {
  const movement = product.previousPosition ? product.previousPosition - product.position : 0;
  const iconSize = compact ? 11 : 17;

  if (product.trend === "new") {
    return <span className={cn("font-black uppercase tracking-[0.12em] text-[#3e8e65]", compact ? "text-[9px]" : "text-xs")}>New</span>;
  }

  if (movement > 0) {
    return <span className={cn("inline-flex items-center gap-1 font-black text-[#3e8e65]", compact ? "text-[10px]" : "text-lg")}><ArrowUp size={iconSize} strokeWidth={3} />{movement}</span>;
  }

  if (movement < 0) {
    return <span className={cn("inline-flex items-center gap-1 font-black text-coral", compact ? "text-[10px]" : "text-lg")}><ArrowDown size={iconSize} strokeWidth={3} />{Math.abs(movement)}</span>;
  }

  return <span className={cn("inline-flex items-center gap-1 font-bold text-muted", compact ? "text-[10px]" : "text-sm")}><Minus size={iconSize} /></span>;
}

function StatusBadge({ tone, leader }: { tone: BoardTone; leader: boolean }) {
  const style = boardStyle(tone);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-[12px] rounded-br-[5px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", leader ? "animate-pulse-soft bg-coral" : "bg-current")} />
      {style.live}
    </span>
  );
}

function TowerStat({ label, value, tone, reach = false }: { label: string; value: string; tone: BoardTone; reach?: boolean }) {
  const style = boardStyle(tone);
  return (
    <div className="min-w-0 text-center">
      <p className={cn("flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em]", style.stat)}>
        {reach ? <MousePointer2 size={13} /> : <Trophy size={13} />}
        {label}
      </p>
      <p className="display mt-1 text-xl font-black tracking-[-0.05em] text-ink">{value}</p>
    </div>
  );
}

function RankStars({ tone }: { tone: BoardTone }) {
  const style = boardStyle(tone);
  let filled: 1 | 2 | 3;
  switch (tone) {
    case "gold":
      filled = 3;
      break;
    case "silver":
      filled = 2;
      break;
    case "bronze":
      filled = 1;
      break;
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }

  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {([1, 2, 3] as const).map((pip) => (
        <Sparkles
          key={pip}
          size={10}
          className={pip <= filled ? style.star : "opacity-20"}
          fill={pip <= filled ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

function RankCap({ position, tone, leader }: { position: number; tone: BoardTone; leader: boolean }) {
  const style = boardStyle(tone);
  return (
    <div className={cn("relative flex flex-col items-center px-3 py-2.5", style.cap)}>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80" />
      <span className="opacity-80">
        <RankIcon tone={tone} />
      </span>
      <span className={cn("display mt-0.5 font-black leading-none tracking-[-0.1em]", leader ? "text-4xl" : "text-3xl")}>
        {String(position).padStart(2, "0")}
      </span>
      <div className="mt-1">
        <RankStars tone={tone} />
      </div>
    </div>
  );
}

function PodiumTower({ product, position, round, leader, tone }: { product: Product; position: number; round: LeaderboardRound; leader: boolean; tone: BoardTone }) {
  const style = boardStyle(tone);
  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-[24px] rounded-br-[10px] border-2", style.frame, podiumSlot(tone))}>
      <RankCap position={position} tone={tone} leader={leader} />
      <div className="flex flex-1 flex-col items-center px-4 py-4 text-center">
        <Link href={`/product/${product.slug}`} className="shrink-0">
          <ProductLogo product={product} size="md" className={cn("border-2 border-white shadow-none ring-1", style.logoRing)} />
        </Link>
        <Link href={`/product/${product.slug}`} className="mt-2 min-w-0 max-w-full">
          <h3 className={cn("display truncate font-black tracking-[-0.045em] text-ink transition group-hover:text-coral", leader ? "text-xl" : "text-lg")}>{product.name}</h3>
        </Link>
        <div className="mt-1.5">
          <StatusBadge tone={tone} leader={leader} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted">{product.shortDescription}</p>
        <div className="mt-1.5"><Movement product={product} compact /></div>
        <div className="mt-auto grid w-full grid-cols-2 gap-2 pt-3">
          <TowerStat label="Bid" value={formatMoney(product.bidCents)} tone={tone} />
          <TowerStat label="Reach" value={formatCompact(product.totalQualifiedClicks)} tone={tone} reach />
        </div>
        <div className="mt-3 w-full">
          <BidDialog productId={product.id} productName={product.name} currentBidCents={product.bidCents} roundId={round.id} buttonLabel={leader ? "Defend #1" : "Take the lead"} buttonVariant={tone === "silver" ? "blue" : tone} buttonSize="compact" />
        </div>
      </div>
    </article>
  );
}

function OtherPlacement({ product, position, round }: { product: Product; position: number; round: LeaderboardRound }) {
  return (
    <div className="grid gap-3 border-t border-line/80 px-4 py-4 first:border-t-0 sm:grid-cols-[70px_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5">
      <div className="flex items-center gap-2">
        <span className="display text-xl font-black text-ink">{String(position).padStart(2, "0")}</span>
        <Movement product={product} compact />
      </div>
      <Link href={`/product/${product.slug}`} className="group flex min-w-0 items-center gap-3">
        <ProductLogo product={product} size="sm" className="border border-white" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-ink group-hover:text-coral">{product.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">{product.shortDescription}</span>
        </span>
      </Link>
      <div className="flex items-center gap-3 text-sm font-black text-ink sm:justify-self-end">
        <span>{formatMoney(product.bidCents)}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-muted"><MousePointer2 size={13} />{formatCompact(product.totalQualifiedClicks)}</span>
      </div>
      <div className="sm:justify-self-end">
        <BidDialog productId={product.id} productName={product.name} currentBidCents={product.bidCents} roundId={round.id} buttonVariant="blue" buttonSize="compact" />
      </div>
    </div>
  );
}

function ShieldEmblem() {
  return (
    <div className="relative hidden h-[88px] w-[88px] shrink-0 sm:grid place-items-center rounded-[24px] rounded-br-[10px] border-2 border-[#e4c15a] bg-[linear-gradient(145deg,#ffe8a8,#e0ab39)] shadow-[0_10px_24px_rgba(201,148,32,.22)]" aria-hidden="true">
      <ShieldCheck size={34} strokeWidth={2.4} className="text-[#172638]" />
      <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-[10px] rounded-br-[4px] border border-[#4d3a14]/25 bg-[#172638] text-[#ffca3d]">
        <Sparkles size={13} fill="currentColor" />
      </span>
    </div>
  );
}

export function DailyBrawlBoard({ products, round }: { products: Product[]; round: LeaderboardRound }) {
  const others = products.slice(3);

  return (
    <section className="relative overflow-visible py-2 sm:py-4 lg:py-5">
      <div className="pointer-events-none absolute -left-24 top-28 h-64 w-64 rounded-full bg-[#fff0c8]/65 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-20 h-72 w-72 rounded-full bg-[#e7f1fb]/85 blur-3xl" />

      <div className="relative">
        <div className="relative grid gap-6 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-center">
          <ShieldEmblem />
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14] sm:text-xs">
              On the board
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#4d3a14]/20 bg-[#4d3a14]/10">
                <Trophy size={13} fill="currentColor" />
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <h2 className="display text-4xl font-black uppercase italic leading-none tracking-[-0.055em] text-[#142638] sm:text-5xl lg:text-6xl">The Daily Brawl</h2>
              <span className="hidden text-2xl font-black tracking-[-0.18em] text-[#f2b92e] sm:inline">{"///"}</span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#405168] sm:text-base">A transparent sponsored leaderboard. The bid decides position; every successful bid also creates a measurable promotional campaign.</p>
          </div>
          <ButtonLink href="#bidding-board" variant="secondary" size="lg" arrow className="min-h-[52px] text-center sm:min-h-[58px]">Jump to bidding board</ButtonLink>
        </div>

        <div id="bidding-board" className="relative mt-7 mx-auto w-full max-w-[980px] scroll-mt-24 grid gap-2.5 lg:grid-cols-3 lg:items-end">
          {products[0] ? (
            <PodiumTower product={products[0]} position={1} round={round} leader tone="gold" />
          ) : (
            <div className="rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper p-10 text-center lg:col-start-2">
              <ShieldCheck size={24} className="mx-auto text-[#c18b1e]" />
              <p className="mt-3 font-black text-ink">The top spot is open</p>
              <p className="mt-1 text-sm text-muted">Confirmed bids from this round will appear here.</p>
            </div>
          )}
          {products[1] ? <PodiumTower product={products[1]} position={2} round={round} leader={false} tone="silver" /> : null}
          {products[2] ? <PodiumTower product={products[2]} position={3} round={round} leader={false} tone="bronze" /> : null}
        </div>

        {others.length ? (
          <div className="relative mt-4 border-t border-line/70">
            <div className="flex items-center justify-between gap-3 px-1 py-3 sm:px-2">
              <div className="eyebrow text-muted">Other live placements</div>
              <span className="text-xs font-bold text-muted">{others.length} more</span>
            </div>
            {others.map((product, index) => <OtherPlacement key={product.id} product={product} position={index + 4} round={round} />)}
          </div>
        ) : null}

        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
          <p className="inline-flex items-center gap-2 text-xs text-[#536073]">
            <span className="h-2.5 w-2.5 rounded-full bg-coral shadow-[0_0_0_5px_rgba(255,107,74,.15)]" />
            <span className="font-black uppercase tracking-[0.08em] text-coral">Live leaderboard</span>
            <span className="hidden sm:inline">resets at midnight UTC</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden h-9 w-9 place-items-center rounded-[12px] rounded-br-[5px] border border-[#e1b43c] bg-[#fff8dd] text-[#d28e10] sm:grid">
              <Swords size={17} />
            </span>
            <p className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-[#536073]">
              <span>Round ends in</span>
              <span className="display text-lg font-black tracking-normal text-[#1b2b3d]"><CountdownTimer endsAt={round.endsAt} /></span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
