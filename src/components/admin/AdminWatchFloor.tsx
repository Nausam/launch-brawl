import Link from "next/link";
import { Database, Flag, Gavel, Radio, Settings2, ShieldCheck } from "lucide-react";
import type { LeaderboardRound, Product } from "@/lib/types";
import { cn, formatMoney, relativeTime } from "@/lib/utils";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ProductBoardBadge, ProductBoardCard } from "@/components/products/ProductBoardCard";
import { podiumStyle } from "@/components/products/product-board";
import { CountdownTimer } from "@/components/leaderboard/CountdownTimer";
import { ButtonLink } from "@/components/ui/Button";

type TicketKind = "listing" | "claim";
type RoundStatus = LeaderboardRound["status"];
type LampState = "clear" | "alert" | "standby";
type CorridorTone = "coral" | "gold" | "blue" | "mint";
type RankTone = "gold" | "silver" | "bronze" | "rest";

export type AdminClaimTicket = {
  id: string;
  productId: string;
  claimantUserId: string;
  evidence: string;
  createdAt: string;
};

export type AdminQueueTicket =
  | { kind: "listing"; id: string; product: Product }
  | { kind: "claim"; id: string; claim: AdminClaimTicket };

export type AdminSystemLamp = {
  id: string;
  label: string;
  detail: string;
  state: LampState;
};

function ticketTone(kind: TicketKind): RankTone {
  switch (kind) {
    case "listing":
      return "bronze";
    case "claim":
      return "silver";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function ticketLabel(kind: TicketKind) {
  switch (kind) {
    case "listing":
      return "Listing review";
    case "claim":
      return "Ownership claim";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function roundStatusLabel(status: RoundStatus) {
  switch (status) {
    case "UPCOMING":
      return "Armed";
    case "ACTIVE":
      return "Live";
    case "FINALIZING":
      return "Closing";
    case "COMPLETED":
      return "Settled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function roundStatusTone(status: RoundStatus): RankTone {
  switch (status) {
    case "ACTIVE":
      return "gold";
    case "UPCOMING":
      return "silver";
    case "FINALIZING":
      return "bronze";
    case "COMPLETED":
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
        medal: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]",
        badge: "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]",
        wash: "bg-[#fff0b5]/45",
      };
    case "silver":
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(135deg,#eef6fc_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(80,130,170,.14)]",
        medal: "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]",
        badge: "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]",
        wash: "bg-[#d9ecfb]/45",
      };
    case "bronze":
      return {
        frame: "border-[#e2b189] bg-[linear-gradient(135deg,#fbeede_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(176,110,58,.14)]",
        medal: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf6,#f8e0c8,#e2b189)] text-[#9b5d2d]",
        badge: "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]",
        wash: "bg-[#f6dfca]/45",
      };
    case "rest":
      return {
        frame: "border-[#d6e3ef] bg-white/80 shadow-[0_10px_24px_rgba(20,33,43,.06)]",
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

function lampStyle(state: LampState) {
  switch (state) {
    case "clear":
      return {
        frame: "border-[#2f6f50] bg-[#e8f6ee] text-[#245c42]",
        lamp: "bg-[#3E8E65] shadow-[0_0_12px_rgba(62,142,101,.55)]",
        label: "Clear",
      };
    case "alert":
      return {
        frame: "border-coral-dark bg-coral/10 text-coral",
        lamp: "bg-coral shadow-[0_0_12px_rgba(255,107,74,.55)]",
        label: "Alert",
      };
    case "standby":
      return {
        frame: "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]",
        lamp: "bg-[#6f97b4] shadow-[0_0_12px_rgba(111,151,180,.4)]",
        label: "Standby",
      };
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function corridorStyle(tone: CorridorTone) {
  switch (tone) {
    case "coral":
      return {
        frame: "border-coral/30 bg-coral/10",
        number: "text-coral",
        icon: "border-coral/30 bg-coral text-white",
      };
    case "gold":
      return {
        frame: "border-[#c58a0a]/35 bg-[linear-gradient(180deg,#fff8df,#fff1b8)]",
        number: "text-[#7f570b]",
        icon: "border-[#c58a0a]/30 bg-[#f0c54a]/40 text-[#8d610f]",
      };
    case "blue":
      return {
        frame: "border-[#b7cfe0] bg-[#eef6fc]",
        number: "text-[#355875]",
        icon: "border-[#b7cfe0] bg-white text-[#355875]",
      };
    case "mint":
      return {
        frame: "border-[#2f6f50]/25 bg-[#e8f6ee]",
        number: "text-[#245c42]",
        icon: "border-[#3E8E65]/25 bg-white/70 text-[#3E8E65]",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
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

function TicketBody({ ticket }: { ticket: AdminQueueTicket }) {
  switch (ticket.kind) {
    case "listing":
      return (
        <div className="min-w-0 px-4 pb-4 sm:px-0 sm:py-5">
          <div className="flex items-center gap-3">
            <ProductLogo product={ticket.product} size="md" />
            <div className="min-w-0">
              <p className="display text-lg font-black tracking-[-0.03em] text-ink">{ticket.product.name}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{ticket.product.shortDescription}</p>
              <p className="mt-2 text-[11px] font-bold text-muted">Submitted by {ticket.product.makerName || "Unknown maker"}</p>
            </div>
          </div>
        </div>
      );
    case "claim":
      return (
        <div className="min-w-0 px-4 pb-4 sm:px-0 sm:py-5">
          <p className="font-mono text-xs font-black text-ink">{ticket.claim.productId}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{ticket.claim.evidence || "No evidence attached."}</p>
          <p className="mt-2 text-[11px] font-bold text-muted">
            Claimant {ticket.claim.claimantUserId || "Unknown"}
            {ticket.claim.createdAt ? ` · ${relativeTime(ticket.claim.createdAt)}` : ""}
          </p>
        </div>
      );
    default: {
      const _exhaustive: never = ticket;
      return _exhaustive;
    }
  }
}

function QueueTicket({ ticket, index }: { ticket: AdminQueueTicket; index: number }) {
  const tone = ticketTone(ticket.kind);
  const style = rankStyle(tone);
  const stub = String(index + 1).padStart(2, "0");

  switch (ticket.kind) {
    case "listing":
      return (
        <ProductBoardCard
          product={ticket.product}
          index={index}
          tone="bronze"
          plaque="none"
          totals
          href="/admin/products"
          badge={<ProductBoardBadge className={podiumStyle("bronze").badge}>Listing review</ProductBoardBadge>}
          actions={
            <ButtonLink href="/admin/products" variant="secondary" size="sm" arrow>
              Review
            </ButtonLink>
          }
        />
      );
    case "claim":
      return (
        <article className={cn("group relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2", style.frame)}>
          <div className={cn("pointer-events-none absolute -left-16 top-1/2 h-36 w-52 -translate-y-1/2 rounded-full blur-3xl", style.wash)} />
          <div className="relative grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
            <div className="flex items-center justify-between gap-3 border-b border-dashed border-ink/10 px-4 py-4 sm:flex-col sm:justify-center sm:border-b-0 sm:border-r sm:py-5">
              <span className={cn("grid h-12 w-12 place-items-center rounded-[12px] rounded-br-[5px] border text-sm font-black tracking-[-0.08em]", style.medal)}>
                {stub}
              </span>
              <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
                {ticketLabel(ticket.kind)}
              </span>
            </div>
            <TicketBody ticket={ticket} />
            <div className="px-4 pb-4 sm:pr-5 sm:pb-0">
              <ButtonLink href="/admin/products" variant="secondary" size="sm" arrow>
                Review
              </ButtonLink>
            </div>
          </div>
        </article>
      );
    default: {
      const _exhaustive: never = ticket;
      return _exhaustive;
    }
  }
}

function SystemLamp({ lamp }: { lamp: AdminSystemLamp }) {
  const style = lampStyle(lamp.state);
  return (
    <article className={cn("flex items-center gap-3 rounded-[24px] rounded-br-[10px] border-2 px-4 py-4", style.frame)}>
      <span className="relative grid h-10 w-10 place-items-center">
        <span className={cn("h-3.5 w-3.5 rounded-full", style.lamp)} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em]">{style.label}</p>
        <p className="mt-1 text-sm font-black text-ink">{lamp.label}</p>
        <p className="mt-0.5 text-[11px] font-bold text-muted">{lamp.detail}</p>
      </div>
    </article>
  );
}

const corridors: Array<{ bay: string; title: string; detail: string; href: string; icon: typeof Flag; tone: CorridorTone }> = [
  { bay: "01", title: "Moderation", detail: "Review listings, claims, and audit the directory queue.", href: "/admin/products", icon: Flag, tone: "coral" },
  { bay: "02", title: "Bids", detail: "Payment status, concurrency, and refunds.", href: "/admin/bids", icon: Gavel, tone: "gold" },
  { bay: "03", title: "Analytics", detail: "Platform impressions, clicks, and campaign delivery.", href: "/admin/analytics", icon: Database, tone: "blue" },
  { bay: "04", title: "Settings", detail: "Bidding pauses, maintenance, and feature flags.", href: "/admin/settings", icon: Settings2, tone: "mint" },
];

export function AdminWatchFloor({
  tickets,
  remainingTickets,
  round,
  leader,
  lamps,
  liveBrawls,
  completedBrawls,
}: {
  tickets: AdminQueueTicket[];
  remainingTickets: number;
  round?: LeaderboardRound;
  leader?: Product;
  lamps: AdminSystemLamp[];
  liveBrawls: number;
  completedBrawls: number;
}) {
  const roundTone = round ? roundStatusTone(round.status) : "rest";
  const roundLook = rankStyle(roundTone);

  return (
    <section className="relative pt-5 pb-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#d9ecfb]/55 blur-3xl" />
        <div className="absolute -right-28 bottom-8 h-80 w-80 rounded-full bg-[#e8f6ee]/50 blur-3xl" />
      </div>

      <section id="queue" className="relative scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#e2b189] bg-[#fff4ea] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#9b5d2d] sm:text-xs">
              Intake queue
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#9b5d2d]/20 bg-[#e2b189]/40">
                <Flag size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink sm:text-4xl">What still needs a human.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Pending listings and ownership claims as numbered tickets. Review happens on the moderation desk — this floor only shows the backlog.</p>
          </div>
          <span className="text-xs font-bold text-muted">
            {tickets.length + remainingTickets} {tickets.length + remainingTickets === 1 ? "ticket" : "tickets"}
          </span>
        </div>
        {tickets.length ? (
          <div className="mt-4 grid gap-3">
            {tickets.map((ticket, index) => (
              <QueueTicket key={`${ticket.kind}-${ticket.id}`} ticket={ticket} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyLane title="The intake queue is clear" body="New product submissions and ownership claims will land here as numbered tickets." action={{ href: "/admin/products", label: "Open moderation" }} />
          </div>
        )}
        {remainingTickets > 0 ? (
          <div className="mt-3 flex justify-end">
            <Link href="/admin/products" className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
              {remainingTickets} more on the moderation desk
            </Link>
          </div>
        ) : null}
      </section>

      <section id="round" className="relative mt-10 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-ink bg-ink px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">
              Round console
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/20 bg-white/10">
                <Radio size={13} />
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">The Daily Brawl as an instrument cluster — status, bid, and time — not a public podium strip.</p>
          </div>
          <ButtonLink href="/admin/rounds" variant="secondary" size="sm" arrow>
            Manage rounds
          </ButtonLink>
        </div>
        {round ? (
          <article className="relative mt-4 overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-ink bg-ink px-4 py-5 text-white sm:px-6">
            <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full border-[18px] border-white/5" />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_auto_auto] lg:items-center">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50">{round.id}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", roundLook.badge)}>
                    {roundStatusLabel(round.status)}
                  </span>
                  {leader ? (
                    <span className="inline-flex min-w-0 items-center gap-2 text-sm font-black">
                      <ProductLogo product={leader} size="sm" />
                      <span className="truncate">{leader.name}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-white/60">No confirmed leader</span>
                  )}
                </div>
              </div>
              <div className="rounded-[16px] rounded-br-[7px] border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Winning bid</p>
                <p className="display mt-1 text-2xl font-black tracking-[-0.04em]">{leader ? formatMoney(leader.bidCents) : "—"}</p>
              </div>
              <div className="rounded-[16px] rounded-br-[7px] border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Ends in</p>
                <p className="mt-1 font-mono text-2xl font-black tracking-[-0.04em] text-white [&>span]:text-[1.35rem] [&>span]:text-white">
                  <CountdownTimer endsAt={round.endsAt} compact />
                </p>
              </div>
            </div>
          </article>
        ) : (
          <div className="mt-4">
            <EmptyLane title="No round on the console" body="Open a Daily Brawl round to arm the public board and start taking bids." action={{ href: "/admin/rounds", label: "Open rounds" }} />
          </div>
        )}
      </section>

      <section id="systems" className="relative mt-10 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">
              System lights
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#b7cfe0] bg-white">
                <ShieldCheck size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink">What the desk is running.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Pause flags, payments, and the Firestore connection as lamps — not a nested readiness card.</p>
          </div>
          <Link href="/admin/settings" className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
            Platform settings
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lamps.map((lamp) => (
            <SystemLamp key={lamp.id} lamp={lamp} />
          ))}
        </div>
      </section>

      <section id="lanes" className="relative mt-10 scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              Ops corridors
            </div>
            <p className="mt-2 text-xs text-muted">Numbered bays into the rest of the desk. {liveBrawls} live Brawls · {completedBrawls} completed.</p>
          </div>
          <Link href="/admin/brawls" className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
            Brawl ops
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {corridors.map((corridor) => {
            const style = corridorStyle(corridor.tone);
            const Icon = corridor.icon;
            return (
              <Link
                key={corridor.bay}
                href={corridor.href}
                className={cn("group relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 px-5 py-5 transition hover:-translate-y-0.5", style.frame)}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={cn("display text-4xl font-black leading-none tracking-[-0.08em]", style.number)}>{corridor.bay}</span>
                  <span className={cn("grid h-10 w-10 place-items-center rounded-[12px] rounded-br-[5px] border", style.icon)}>
                    <Icon size={16} />
                  </span>
                </div>
                <p className="mt-6 text-lg font-black text-ink group-hover:text-coral">{corridor.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{corridor.detail}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="relative mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5 text-xs text-muted">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#355875]" />Admin actions write to Firestore with an audit log.</span>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/audit" variant="secondary" size="sm" arrow>Audit logs</ButtonLink>
          <ButtonLink href="/admin/gamification" variant="secondary" size="sm" arrow>Brawl health</ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary" size="sm" arrow>Owner view</ButtonLink>
        </div>
      </div>
    </section>
  );
}
