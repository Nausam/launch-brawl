import { CalendarDays } from "lucide-react";
import type { SeasonStatus } from "@/lib/types";
import { listSeasons } from "@/lib/repositories/competitive";
import { cn } from "@/lib/utils";
import { SeasonAdminForm } from "@/components/admin/GamificationAdminControls";
import { DeskEmpty, DeskHeader, DeskPlaque, DeskStat, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

function seasonTone(status: SeasonStatus, current: boolean): RankTone {
  if (current) return "gold";
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

export default async function AdminSeasonsPage() {
  const seasons = await listSeasons();
  const current = seasons.find((season) => season.current);
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Season calendar"
        title="Roll the year without breaking records."
        description="Create seasons, review current standings, and use the guarded rollover job when a season has ended."
        icon={CalendarDays}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={CalendarDays} value={String(seasons.length)} label="Seasons on file" tone="blue" />
        <DeskStat icon={CalendarDays} value={current?.name ?? "—"} label="Current" tone="gold" />
      </div>
      <div className="relative mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <SeasonAdminForm />
        <section>
          <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
            Season archive
          </div>
          <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">Timeline plaques</h2>
          <div className="mt-4 grid gap-3">
            {seasons.length ? seasons.map((season, index) => {
              const tone = seasonTone(season.status, Boolean(season.current));
              const style = rankStyle(tone);
              return (
                <DeskPlaque key={season.id} tone={tone}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black">{season.name}</p>
                      <p className="mt-1 text-xs text-muted">{season.id} · {new Date(season.startsAt).toLocaleDateString()} – {new Date(season.endsAt).toLocaleDateString()}</p>
                    </div>
                    <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>{season.current ? "CURRENT" : season.status}</span>
                  </div>
                </DeskPlaque>
              );
            }) : <DeskEmpty title="No seasons have been created." body="Use the form to open the first season window." />}
          </div>
        </section>
      </div>
    </div>
  );
}
