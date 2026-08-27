import { CalendarClock, CheckCircle2, LockKeyhole, PlayCircle } from "lucide-react";
import type { LeaderboardRound } from "@/lib/types";
import { getCurrentRound, listDailyWinners } from "@/lib/repositories/catalog";
import { cn, formatMoney } from "@/lib/utils";
import { OpenRoundButton } from "@/components/admin/OpenRoundButton";
import { DeskEmpty, DeskHeader, DeskPlaque, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

export const dynamic = "force-dynamic";

type RoundStatus = LeaderboardRound["status"];

function roundTone(status: RoundStatus): RankTone {
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

export default async function AdminRoundsPage() {
  const [current, winners] = await Promise.all([getCurrentRound(), listDailyWinners()]);
  const liveTone = current ? roundTone(current.status) : "rest";
  const liveStyle = rankStyle(liveTone);
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Round console"
        title="Open, watch, finalize."
        description="Round creation and finalization are server jobs and remain safe to run more than once."
        icon={PlayCircle}
      />
      {current ? (
        <article className="relative mt-8 overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-ink bg-ink p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-coral">Active round</p>
              <h2 className="display mt-2 text-2xl font-black">{current.id}</h2>
            </div>
            <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", liveStyle.badge)}>{current.status}</span>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] rounded-br-[7px] border border-white/15 bg-white/5 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">Starts</p>
              <p className="mt-2 break-all text-xs font-bold">{new Date(current.startsAt).toISOString()}</p>
            </div>
            <div className="rounded-[16px] rounded-br-[7px] border border-white/15 bg-white/5 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">Ends</p>
              <p className="mt-2 break-all text-xs font-bold">{new Date(current.endsAt).toISOString()}</p>
            </div>
            <div className="rounded-[16px] rounded-br-[7px] border border-white/15 bg-white/5 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">Leader bid</p>
              <p className="mt-2 text-xs font-bold">{formatMoney(current.winningBidCents ?? 0)}</p>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-white/20 px-4 py-2.5 text-xs font-bold"><LockKeyhole size={14} />Finalization runs through the protected cron endpoint</span>
            <span className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-white/20 px-4 py-2.5 text-xs font-bold"><CalendarClock size={14} />UTC timestamps</span>
          </div>
        </article>
      ) : (
        <div className="mt-8">
          <DeskEmpty title="No active sponsored round is configured." body="Open today’s round from the console when the board should accept bids." action={<OpenRoundButton />} />
        </div>
      )}
      <section className="relative mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              Recent finalized rounds
            </div>
            <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">Winners on file</h2>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.12em] text-muted">{winners.length} records</span>
        </div>
        <div className="mt-4 grid gap-3">
          {winners.slice(0, 20).length ? winners.slice(0, 20).map((winner, index) => (
            <DeskPlaque key={winner.id} tone={index === 0 ? "gold" : index === 1 ? "silver" : "rest"}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border border-[#c9d7e4] bg-[#eef4fa] text-[11px] font-black">{padTicket(index)}</span>
                  <div>
                    <p className="font-black">{winner.date} · {winner.productName}</p>
                    <p className="mt-1 text-xs text-muted">Verified sponsored leaderboard winner</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#3E8E65]"><CheckCircle2 size={14} />Completed</span>
              </div>
            </DeskPlaque>
          )) : <DeskEmpty title="No sponsored rounds have been finalized." body="When midnight UTC closes a round, the winner stamps here." />}
        </div>
      </section>
    </div>
  );
}
