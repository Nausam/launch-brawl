import { AlertTriangle, BarChart3, Clock3, Radio } from "lucide-react";
import type { CampaignStatus } from "@/lib/types";
import { listAdminCampaigns } from "@/lib/repositories/admin";
import { cn, formatCompact, formatMoney } from "@/lib/utils";
import { DeskEmpty, DeskHeader, DeskPlaque, DeskStat, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

export const dynamic = "force-dynamic";

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

export default async function AdminCampaignsPage() {
  const campaigns = await listAdminCampaigns();
  const delivering = campaigns.filter((campaign) => campaign.status === "ACTIVE").length;
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Commitment rails"
        title="Watch purchased inventory move."
        description="Monitor purchased inventory, delivered impressions, outstanding commitments, clicks, and status."
        icon={Radio}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={BarChart3} value={String(campaigns.length)} label="Campaigns" tone="blue" />
        <DeskStat icon={Radio} value={String(delivering)} label="Delivering" tone="gold" />
      </div>
      <div className="relative mt-8 grid gap-3">
        {campaigns.length ? campaigns.map((campaign, index) => {
          const percent = campaign.purchasedImpressions > 0 ? Math.round((campaign.qualifiedImpressions / campaign.purchasedImpressions) * 100) : 0;
          const tone = campaignTone(campaign.status);
          const style = rankStyle(tone);
          return (
            <DeskPlaque key={campaign.id} tone={tone}>
              <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_1fr_auto] sm:items-center">
                <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                <div>
                  <p className="font-black">{campaign.productName}</p>
                  <p className="mt-1 text-xs text-muted">{formatMoney(campaign.purchasedAmountCents)} · {formatCompact(campaign.remainingImpressions)} outstanding</p>
                  <span className={cn("mt-2 inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>{campaign.status}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span>{formatCompact(campaign.qualifiedImpressions)} qualified</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-[8px] rounded-br-[3px] bg-paper-strong">
                    <div className={cn("h-full bg-gradient-to-r", style.heat)} style={{ width: `${Math.min(100, percent)}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">{formatCompact(campaign.clicks)} clicks · {formatCompact(campaign.deliveredImpressions)} delivered</p>
                </div>
                <Clock3 size={16} className={campaign.status === "COMPLETED" ? "text-[#3E8E65]" : "text-coral"} />
              </div>
            </DeskPlaque>
          );
        }) : <DeskEmpty title="No paid campaigns are available." body="Successful bids create allocations that appear on these rails." />}
      </div>
      <p className="mt-8 flex items-start gap-3 text-xs leading-5 text-[#876d27]">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        Outstanding inventory is calculated from persisted campaign allocation and qualified delivery counters.
      </p>
    </div>
  );
}
