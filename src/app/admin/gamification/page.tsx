import Link from "next/link";
import { Activity, AlertTriangle, Database, Flag, Gauge, ShieldCheck, Trophy } from "lucide-react";
import { getArenaSections, listChallenges, listSeasons } from "@/lib/repositories/competitive";
import { getGamificationAdminMetrics } from "@/lib/repositories/admin";
import { cn } from "@/lib/utils";
import { DeskHeader, DeskPlaque, DeskStat, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

type LampState = "clear" | "alert" | "standby";

function lampTone(state: LampState): RankTone {
  switch (state) {
    case "clear":
      return "gold";
    case "standby":
      return "silver";
    case "alert":
      return "bronze";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function lampLabel(state: LampState) {
  switch (state) {
    case "clear":
      return "Clear";
    case "standby":
      return "Standby";
    case "alert":
      return "Alert";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export default async function AdminGamificationPage() {
  const [arena, challenges, seasons, metrics] = await Promise.all([getArenaSections(), listChallenges(), listSeasons(), getGamificationAdminMetrics()]);
  const pending = challenges.filter((challenge) => challenge.status === "PENDING").length || metrics.pendingChallenges;
  const lamps: Array<{ id: string; label: string; detail: string; value: string; state: LampState }> = [
    { id: "paid", label: "Paid ranking isolation", detail: "Sponsored bid data is not used by rating, league, XP, or Tastemaker services.", value: "Enforced", state: "clear" },
    { id: "votes", label: "Vote uniqueness", detail: "brawlVotes/{brawlId}_{userId} plus server-side ownership of the product pair.", value: "Deterministic", state: "clear" },
    { id: "final", label: "Finalization", detail: "A completed Brawl is guarded before Elo, points, predictions, and reports update.", value: "Idempotent", state: "clear" },
    { id: "predict", label: "Prediction lock", detail: "Predictions close before the final stretch and draws are voided.", value: "80% elapsed", state: "standby" },
  ];
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Health lamps"
        title="Keep the competitive layer honest."
        description="Read-only operational view for Brawl lifecycle, challenges, seasons, safety switches, and integrity metrics."
        icon={ShieldCheck}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Activity} value={String(arena.live.length)} label="Live Brawls" tone="coral" />
        <DeskStat icon={Flag} value={String(pending)} label="Pending challenges" tone="gold" />
        <DeskStat icon={Trophy} value={String(metrics.productsWithRecords)} label="Products with records" tone="mint" />
        <DeskStat icon={ShieldCheck} value={metrics.currentSeason || seasons.find((season) => season.current)?.name || "—"} label="Current season" tone="blue" />
      </div>
      <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
        {lamps.map((lamp) => {
          const tone = lampTone(lamp.state);
          const style = rankStyle(tone);
          return (
            <DeskPlaque key={lamp.id} tone={tone}>
              <div className="flex items-start gap-3">
                <Gauge size={16} className="mt-0.5 text-coral" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{lamp.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{lamp.detail}</p>
                </div>
                <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>{lampLabel(lamp.state)}</span>
              </div>
              <p className="mt-3 text-xs font-black text-[#3E8E65]">{lamp.value}</p>
            </DeskPlaque>
          );
        })}
      </div>
      <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/settings" className="block">
          <DeskPlaque tone="bronze">
            <Flag size={18} className="text-[#9b5d2d]" />
            <p className="mt-4 text-sm font-black">Safety switches</p>
            <p className="mt-1 text-xs leading-5 text-muted">Brawls, challenges, predictions, Daily Picks, Boss Brawls, and bounties have centralized feature flags.</p>
          </DeskPlaque>
        </Link>
        <Link href="/admin/settings" className="block">
          <DeskPlaque tone="silver">
            <Database size={18} className="text-[#355875]" />
            <p className="mt-4 text-sm font-black">Repair tools</p>
            <p className="mt-1 text-xs leading-5 text-muted">Verify product totals, rating consistency, season points, predictions, and achievement duplicates before repair.</p>
          </DeskPlaque>
        </Link>
        <Link href="/seasons" className="block">
          <DeskPlaque tone="gold">
            <Trophy size={18} className="text-[#7f570b]" />
            <p className="mt-4 text-sm font-black">Season controls</p>
            <p className="mt-1 text-xs leading-5 text-muted">Review current standings, champions, division movement, and rollover readiness.</p>
          </DeskPlaque>
        </Link>
        <Link href="/admin/products" className="block">
          <DeskPlaque tone="rest">
            <AlertTriangle size={18} className="text-coral" />
            <p className="mt-4 text-sm font-black">Abuse review</p>
            <p className="mt-1 text-xs leading-5 text-muted">Challenge cooldowns, rate limits, duplicate votes, and product ownership stay server-side.</p>
          </DeskPlaque>
        </Link>
      </div>
    </div>
  );
}
