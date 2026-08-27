import Link from "next/link";
import { Check, Flame, Minus, Radio, Sparkles, Swords, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ActivityEvent, Product } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ButtonLink } from "@/components/ui/Button";

export type TapeWindow = "now" | "today" | "week" | "earlier";
type ActivityKind = "win" | "draw" | "streak" | "prediction" | "bounty" | "other";
type KnownActivityType = "BRAWL_WIN" | "BRAWL_DRAW" | "WIN_STREAK" | "PREDICTION_STREAK" | "BOUNTY_COMPLETED";

export const tapeJumps: Array<{ key: TapeWindow; label: string }> = [
  { key: "now", label: "Just now" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "earlier", label: "Earlier" },
];

function isKnownActivityType(type: string): type is KnownActivityType {
  switch (type) {
    case "BRAWL_WIN":
    case "BRAWL_DRAW":
    case "WIN_STREAK":
    case "PREDICTION_STREAK":
    case "BOUNTY_COMPLETED":
      return true;
    default:
      return false;
  }
}

function kindForType(type: string): ActivityKind {
  if (!isKnownActivityType(type)) return "other";
  switch (type) {
    case "BRAWL_WIN":
      return "win";
    case "BRAWL_DRAW":
      return "draw";
    case "WIN_STREAK":
      return "streak";
    case "PREDICTION_STREAK":
      return "prediction";
    case "BOUNTY_COMPLETED":
      return "bounty";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function kindMeta(kind: ActivityKind): { label: string; icon: LucideIcon } {
  switch (kind) {
    case "win":
      return { label: "Brawl win", icon: Trophy };
    case "draw":
      return { label: "Brawl draw", icon: Minus };
    case "streak":
      return { label: "Win streak", icon: Flame };
    case "prediction":
      return { label: "Prediction", icon: Target };
    case "bounty":
      return { label: "Bounty", icon: Sparkles };
    case "other":
      return { label: "Public signal", icon: Radio };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function kindStyle(kind: ActivityKind) {
  switch (kind) {
    case "win":
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(201,148,32,.16)]",
        rail: "bg-[#f0c54a]",
        wash: "bg-[#fff0b5]/45",
        tile: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]",
        stamp: "text-[#7f570b]",
        stampLabel: "text-[#a26d08]",
        badge: "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]",
        ring: "border-[#e9c96b]",
        logoRing: "ring-[#f7d26e]/80",
        node: "border-[#c58a0a] bg-[#f0c54a] text-[#7f570b]",
        copy: "text-ink",
        quiet: "text-muted",
      };
    case "draw":
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(135deg,#eef6fc_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(80,130,170,.14)]",
        rail: "bg-[#9bbdd4]",
        wash: "bg-[#d9ecfb]/45",
        tile: "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]",
        stamp: "text-[#355875]",
        stampLabel: "text-[#40698c]",
        badge: "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]",
        ring: "border-[#b9d2e6]",
        logoRing: "ring-[#d5e3ef]",
        node: "border-[#6f97b4] bg-[#9bbdd4] text-white",
        copy: "text-ink",
        quiet: "text-muted",
      };
    case "streak":
      return {
        frame: "border-coral/45 bg-[linear-gradient(135deg,#fff4ee_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(255,107,74,.14)]",
        rail: "bg-coral",
        wash: "bg-coral/15",
        tile: "border-coral bg-[linear-gradient(180deg,#fff7f3,#ffd8cc,#ff6b4a)] text-white",
        stamp: "text-white",
        stampLabel: "text-white/80",
        badge: "border-coral/30 bg-coral/10 text-coral",
        ring: "border-coral/35",
        logoRing: "ring-coral/40",
        node: "border-coral-dark bg-coral text-white",
        copy: "text-ink",
        quiet: "text-muted",
      };
    case "prediction":
      return {
        frame: "border-[#c5b8ea] bg-[linear-gradient(135deg,#efe8fb_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(95,72,182,.12)]",
        rail: "bg-[#8b74d4]",
        wash: "bg-[#efe8fb]/70",
        tile: "border-[#c5b8ea] bg-[linear-gradient(180deg,#fbf8ff,#efe8fb,#d9cdf3)] text-[#5f48b6]",
        stamp: "text-[#5f48b6]",
        stampLabel: "text-[#7a63c7]",
        badge: "border-[#c5b8ea] bg-[#efe8fb] text-[#5f48b6]",
        ring: "border-[#c5b8ea]",
        logoRing: "ring-[#d9cdf3]",
        node: "border-[#5f48b6] bg-[#8b74d4] text-white",
        copy: "text-ink",
        quiet: "text-muted",
      };
    case "bounty":
      return {
        frame: "border-ink bg-[linear-gradient(135deg,#1b2833_0%,#243644_55%,#1b2833_100%)] text-white shadow-[0_16px_40px_rgba(20,33,43,.22)]",
        rail: "bg-coral",
        wash: "bg-coral/20",
        tile: "border-white/20 bg-white/10 text-white",
        stamp: "text-white",
        stampLabel: "text-white/70",
        badge: "border-white/20 bg-white/10 text-white",
        ring: "border-white/20",
        logoRing: "ring-white/30",
        node: "border-ink bg-ink text-white",
        copy: "text-white",
        quiet: "text-white/70",
      };
    case "other":
      return {
        frame: "border-[#d6e3ef] bg-white/80 shadow-[0_10px_24px_rgba(20,33,43,.06)]",
        rail: "bg-[#c9d7e4]",
        wash: "bg-[#eef4fa]/50",
        tile: "border-[#c9d7e4] bg-[linear-gradient(180deg,#ffffff,#eef4fa,#d6e3ef)] text-ink",
        stamp: "text-ink",
        stampLabel: "text-muted",
        badge: "border-line bg-paper text-muted",
        ring: "border-[#c9d7e4]",
        logoRing: "ring-[#d5e3ef]",
        node: "border-[#9bbdd4] bg-[#c9d7e4] text-ink",
        copy: "text-ink",
        quiet: "text-muted",
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function windowMeta(window: TapeWindow) {
  switch (window) {
    case "now":
      return { title: "Just now", description: "The last two hours on the public tape." };
    case "today":
      return { title: "Earlier today", description: "Public signals from this UTC day." };
    case "week":
      return { title: "This week", description: "Wins, streaks, and movement still in recent memory." };
    case "earlier":
      return { title: "Earlier", description: "The record that still belongs on the public tape." };
    default: {
      const _exhaustive: never = window;
      return _exhaustive;
    }
  }
}

function windowStyle(window: TapeWindow) {
  switch (window) {
    case "now":
      return "border-coral/30 bg-coral/10 text-coral";
    case "today":
      return "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]";
    case "week":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    case "earlier":
      return "border-line bg-paper text-muted";
    default: {
      const _exhaustive: never = window;
      return _exhaustive;
    }
  }
}

export function windowForEvent(createdAt: string, now = Date.now()): TapeWindow {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "earlier";
  if (now - created < 2 * 3_600_000) return "now";
  const today = new Date(now);
  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (created >= startOfToday) return "today";
  if (now - created < 7 * 86_400_000) return "week";
  return "earlier";
}

function eventHref(event: ActivityEvent, product?: Product) {
  if (product) return `/product/${product.slug}`;
  switch (event.entityType) {
    case "BRAWL":
      return `/brawl/${event.entityId}`;
    case "PRODUCT":
      return undefined;
    case "USER":
      return undefined;
    case "SEASON":
      return `/seasons/${event.entityId}`;
    case "LEAGUE":
      return `/league/${event.entityId}`;
    default: {
      const _exhaustive: never = event.entityType;
      return _exhaustive;
    }
  }
}

function actionLabel(event: ActivityEvent, product?: Product) {
  if (product) return "View launch";
  switch (event.entityType) {
    case "BRAWL":
      return "View brawl";
    case "PRODUCT":
      return "View launch";
    case "USER":
      return "View profile";
    case "SEASON":
      return "View season";
    case "LEAGUE":
      return "View league";
    default: {
      const _exhaustive: never = event.entityType;
      return _exhaustive;
    }
  }
}

function eventTitle(event: ActivityEvent) {
  const label = event.metadata.label;
  if (typeof label === "string" && label.trim()) return label;
  return event.type.replaceAll("_", " ").toLowerCase();
}

function eventDetail(event: ActivityEvent, kind: ActivityKind) {
  switch (kind) {
    case "win": {
      const delta = event.metadata.ratingDelta;
      const margin = event.metadata.margin;
      if (typeof delta === "number") return `Rating ${delta > 0 ? "+" : ""}${delta}`;
      if (typeof margin === "number") return `Margin ${margin}`;
      return "Organic result locked in.";
    }
    case "draw":
      return "The split finished even.";
    case "streak":
      return typeof event.metadata.streak === "number" ? `${event.metadata.streak}-win streak` : "A winning run is still alive.";
    case "prediction":
      return typeof event.metadata.streak === "number" ? `${event.metadata.streak} correct calls` : "A public prediction record moved.";
    case "bounty":
      return typeof event.metadata.xpReward === "number" ? `+${event.metadata.xpReward} XP bounty` : "A public bounty was claimed.";
    case "other":
      return "A public signal landed on the tape.";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function clockStamp(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return { time: "—", day: "TBD" };
  return {
    time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase(),
  };
}

function TapeRow({
  event,
  product,
  live,
}: {
  event: ActivityEvent;
  product?: Product;
  live: boolean;
}) {
  const kind = kindForType(event.type);
  const style = kindStyle(kind);
  const meta = kindMeta(kind);
  const Icon = meta.icon;
  const href = eventHref(event, product);
  const stamp = clockStamp(event.createdAt);

  return (
    <article className={cn("group relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 px-4 py-4 sm:px-5 sm:py-5", style.frame)}>
      <div className={cn("pointer-events-none absolute inset-y-0 left-0 w-1.5", style.rail)} />
      <div className={cn("pointer-events-none absolute -left-16 top-1/2 h-36 w-52 -translate-y-1/2 rounded-full blur-3xl", style.wash)} />
      <div className="relative grid gap-5 pl-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-[4.5rem] w-16 place-content-center rounded-[16px] rounded-br-[7px] border-2 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]", style.tile)}>
            <span className={cn("text-[10px] font-black uppercase tracking-[0.16em]", style.stampLabel)}>{stamp.day}</span>
            <span className={cn("display text-xl font-black leading-none tracking-[-0.06em]", style.stamp)}>{stamp.time}</span>
          </span>
          <span className={cn("grid h-10 w-10 place-items-center rounded-[12px] rounded-br-[5px] border", style.node)}>
            <Icon size={16} />
          </span>
        </div>

        <div className="flex min-w-0 items-start gap-4">
          {product ? (
            <Link href={`/product/${product.slug}`} className="relative shrink-0">
              <div className={cn("pointer-events-none absolute -inset-2 rounded-[22px] border border-dashed opacity-70", style.ring)} />
              <ProductLogo product={product} size="lg" className={cn("border-2 border-white shadow-none ring-1", style.logoRing)} />
            </Link>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
                {live ? <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" /> : null}
                {meta.label}
              </span>
              {product?.verified ? (
                <span className="grid h-5 w-5 place-items-center rounded-[8px] rounded-br-[3px] bg-navy text-white" aria-label="Verified product">
                  <Check size={12} />
                </span>
              ) : null}
            </div>
            {product ? (
              <Link href={`/product/${product.slug}`} className={cn("display mt-2 text-xl font-black tracking-[-0.03em] transition group-hover:text-coral", style.copy)}>
                {eventTitle(event)}
              </Link>
            ) : (
              <p className={cn("display mt-2 text-xl font-black tracking-[-0.03em]", style.copy)}>{eventTitle(event)}</p>
            )}
            <p className={cn("mt-1 line-clamp-2 text-sm leading-6", style.quiet)}>{eventDetail(event, kind)}</p>
            <p className={cn("mt-2 text-[11px] font-bold", style.quiet)}>{relativeTime(event.createdAt)}</p>
          </div>
        </div>

        {href ? (
          <ButtonLink href={href} variant="secondary" size="sm" arrow>
            {actionLabel(event, product)}
          </ButtonLink>
        ) : null}
      </div>
    </article>
  );
}

export function ActivityTapeBoard({ events, products }: { events: ActivityEvent[]; products: Product[] }) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const now = Date.now();
  const order: TapeWindow[] = ["now", "today", "week", "earlier"];
  const groups = order
    .map((key) => ({ key, events: events.filter((event) => windowForEvent(event.createdAt, now) === key), ...windowMeta(key) }))
    .filter((group) => group.events.length);
  const newestId = events[0]?.id;

  return (
    <section className="relative overflow-hidden pt-5 pb-14 lg:pt-6 lg:pb-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-16 h-80 w-80 rounded-full bg-[#ffd8cc]/40 blur-3xl" />
      <PageContainer className="relative py-0 lg:py-0">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              The public tape
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Radio size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">What just moved.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Wins, streaks, bounties, and season movement — public only. Private votes and personal notifications never appear here.</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-xs font-bold text-muted sm:self-end">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" />
            {events.length} {events.length === 1 ? "signal on the tape" : "signals on the tape"}
          </span>
        </div>

        {groups.length ? (
          <div className="relative mt-8 grid gap-10">
            {groups.map((group) => (
              <section key={group.key} id={group.key} className="scroll-mt-24">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className={cn("inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]", windowStyle(group.key))}>
                      {group.title}
                    </div>
                    <p className="mt-2 text-xs text-muted">{group.description}</p>
                  </div>
                  <span className="text-xs font-bold text-muted">
                    {group.events.length} {group.events.length === 1 ? "signal" : "signals"}
                  </span>
                </div>
                <div className="relative mt-4">
                  <div className="pointer-events-none absolute bottom-6 left-[39px] top-6 hidden w-px bg-line sm:block" />
                  <div className="grid gap-3">
                    {group.events.map((event) => (
                      <TapeRow key={event.id} event={event} product={event.productId ? productMap.get(event.productId) : undefined} live={event.id === newestId} />
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="relative mt-8 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
            <div className="eyebrow text-coral">The tape is quiet</div>
            <p className="mt-3 text-lg font-bold text-ink">Public activity will appear after the first verified event.</p>
            <p className="mt-2 text-sm text-muted">Completed Brawls, streaks, and season movement write the tape. Votes stay private.</p>
          </div>
        )}

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5 text-xs text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-coral" />Private votes and personal notifications never appear here.</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d8a52b]" />The tape is a public record, not a ranking.</span>
        </div>
      </PageContainer>
    </section>
  );
}
