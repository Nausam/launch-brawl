import { Gavel } from "lucide-react";
import type { BrawlBounty } from "@/lib/types";
import { listBounties } from "@/lib/repositories/competitive";
import { cn } from "@/lib/utils";
import { BountyAdminForm } from "@/components/admin/GamificationAdminControls";
import { DeskEmpty, DeskHeader, DeskPlaque, DeskStat, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

function bountyTone(status: BrawlBounty["status"]): RankTone {
  switch (status) {
    case "ACTIVE":
      return "gold";
    case "COMPLETED":
      return "rest";
    case "EXPIRED":
      return "bronze";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function bountyTypeLabel(type: BrawlBounty["type"]) {
  switch (type) {
    case "DEFEAT_BOSS":
      return "Defeat boss";
    case "BREAK_STREAK":
      return "Break streak";
    case "GIANT_KILLER":
      return "Giant killer";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export default async function AdminBountiesPage() {
  const bounties = await listBounties(undefined, 100);
  const live = bounties.filter((bounty) => bounty.status === "ACTIVE").length;
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Bounty slips"
        title="Organic objectives, labeled."
        description="Create and expire organic objectives. Settlement is performed by finalized Brawls and remains idempotent."
        icon={Gavel}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Gavel} value={String(bounties.length)} label="On the ledger" tone="gold" />
        <DeskStat icon={Gavel} value={String(live)} label="Active slips" tone="coral" />
      </div>
      <div className="relative mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <BountyAdminForm />
        <section>
          <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
            Bounty ledger
          </div>
          <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">What the arena is hunting.</h2>
          <div className="mt-4 grid gap-3">
            {bounties.length ? bounties.map((bounty, index) => {
              const tone = bountyTone(bounty.status);
              const style = rankStyle(tone);
              return (
                <DeskPlaque key={bounty.id} tone={tone}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black">{bounty.title}</p>
                      <p className="mt-1 text-xs text-muted">{bountyTypeLabel(bounty.type)} · +{bounty.xpReward} XP · ends {new Date(bounty.endsAt).toLocaleDateString()}</p>
                    </div>
                    <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>{bounty.status}</span>
                  </div>
                </DeskPlaque>
              );
            }) : <DeskEmpty title="No bounties configured." body="Stamp the first organic objective with the form on the left." />}
          </div>
        </section>
      </div>
    </div>
  );
}
