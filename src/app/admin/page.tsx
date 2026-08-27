import Link from "next/link";
import { Flag, Gavel, Radio, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { getAdminMetrics, listPendingProductClaims } from "@/lib/repositories/admin";
import { getCurrentRound, getLeaderboard, listProductsByStatus } from "@/lib/repositories/catalog";
import { getPlatformSettings } from "@/lib/server/settings";
import { cn, formatCompact } from "@/lib/utils";
import { AdminWatchFloor, type AdminQueueTicket, type AdminSystemLamp } from "@/components/admin/AdminWatchFloor";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin desk" };

type DeskStatTone = "coral" | "gold" | "blue" | "mint";
type LampState = AdminSystemLamp["state"];

function deskStatStyle(tone: DeskStatTone) {
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

function DeskStat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string; label: string; tone: DeskStatTone }) {
  const style = deskStatStyle(tone);
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

function pauseLamp(paused: boolean): LampState {
  return paused ? "alert" : "clear";
}

const deskJumps = [
  { key: "queue", label: "Queue" },
  { key: "round", label: "Round" },
  { key: "systems", label: "Systems" },
  { key: "lanes", label: "Corridors" },
] as const;

export default async function AdminPage() {
  const [metrics, round, settings, pendingProducts, claims] = await Promise.all([
    getAdminMetrics(),
    getCurrentRound(),
    getPlatformSettings(),
    listProductsByStatus("PENDING", 8),
    listPendingProductClaims(8),
  ]);
  const leaderboard = await getLeaderboard(round);
  const leader = leaderboard[0];
  const listingTickets: AdminQueueTicket[] = pendingProducts.map((product) => ({ kind: "listing", id: product.id, product }));
  const claimTickets: AdminQueueTicket[] = claims.map((claim) => ({ kind: "claim", id: claim.id, claim }));
  const intake = [...listingTickets, ...claimTickets];
  const tickets = intake.slice(0, 8);
  const remainingTickets = Math.max(0, metrics.pendingProducts + claims.length - tickets.length);
  const firestoreConnected = Boolean(metrics.users || metrics.publishedProducts);
  const lamps: AdminSystemLamp[] = [
    { id: "bidding", label: "Bidding", detail: settings.biddingPaused ? "Paused from settings" : "Open for the live round", state: pauseLamp(settings.biddingPaused) },
    { id: "campaigns", label: "New campaigns", detail: settings.newCampaignsPaused ? "New commitments paused" : `${metrics.activeCampaigns} delivering`, state: pauseLamp(settings.newCampaignsPaused) },
    { id: "maintenance", label: "Maintenance", detail: settings.maintenanceMode ? "Public board is in a window" : "Board is serving traffic", state: pauseLamp(settings.maintenanceMode) },
    { id: "freemius", label: "Payment webhooks", detail: process.env.FREEMIUS_SECRET_KEY ? "Secret configured" : "Needs setup", state: process.env.FREEMIUS_SECRET_KEY ? "clear" : "alert" },
    { id: "firestore", label: "Firestore", detail: firestoreConnected ? `${metrics.users} users · ${metrics.brawlVotes} Brawl votes` : "No records yet", state: firestoreConnected ? "clear" : "standby" },
    { id: "delivery", label: "Impression ledger", detail: `${formatCompact(metrics.impressions)} impressions · ${formatCompact(metrics.clicks)} clicks`, state: metrics.activeCampaigns ? "clear" : "standby" },
  ];

  return (
    <>
      <section className="noise relative border-b border-line pb-3">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-[18%] -top-36 h-[340px] w-[110%] rounded-[50%] border-[14px] border-[#d6e3ef]" />
          <div className="absolute right-[-2rem] top-6 h-44 w-44 rounded-full border-[22px] border-[#b7cfe0]/40" />
        </div>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875] sm:text-xs">
              Watch floor
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#b7cfe0] bg-white">
                <ShieldCheck size={13} />
              </span>
            </div>
            <h1 className="display mt-4 max-w-3xl text-4xl font-black leading-[.95] tracking-[-0.05em] text-ink sm:text-6xl">Keep the board honest.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Moderation tickets, the live round console, and the lamps that say whether bidding, campaigns, and Firestore are actually running.
            </p>
          </div>
          <ButtonLink href="/admin/products" variant="primary" size="md" arrow className="self-start uppercase tracking-[0.08em]">
            Open the queue
          </ButtonLink>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3">
          <DeskStat icon={Flag} value={String(metrics.pendingProducts)} label="Pending listings" tone="coral" />
          <DeskStat icon={Radio} value={String(metrics.liveBrawls)} label="Live Brawls" tone="gold" />
          <DeskStat icon={Gavel} value={String(metrics.activeCampaigns)} label="Active campaigns" tone="mint" />
          <DeskStat icon={Users} value={formatCompact(metrics.users)} label="Signed-in users" tone="blue" />
        </div>

        <div className="relative mt-7 flex items-center gap-3">
          <div className="scrollbar-hide min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex w-max gap-2">
              {deskJumps.map((jump, index) => (
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
      </section>

      <AdminWatchFloor
        tickets={tickets}
        remainingTickets={remainingTickets}
        round={round}
        leader={leader}
        lamps={lamps}
        liveBrawls={metrics.liveBrawls}
        completedBrawls={metrics.completedBrawls}
      />
    </>
  );
}
