import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Campaign, CampaignStatus } from "@/lib/types";
import { cn, formatCompact, formatMoney } from "@/lib/utils";
import { DeskPlaque, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

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

export function CampaignProgress({ campaign }: { campaign: Campaign }) {
  const tone = campaignTone(campaign.status);
  const style = rankStyle(tone);
  const percent = campaign.purchasedImpressions
    ? Math.min(100, Math.round((campaign.qualifiedImpressions / campaign.purchasedImpressions) * 100))
    : 0;
  return (
    <DeskPlaque tone={tone}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-ink">{campaign.productName}</p>
          <p className="mt-1 text-xs text-muted">{formatMoney(campaign.purchasedAmountCents)} · {formatCompact(campaign.purchasedImpressions)} allocated</p>
        </div>
        <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
          {campaignLabel(campaign.status)}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="font-black text-ink">{percent}% delivered</span>
        <span className="text-muted">{formatCompact(campaign.qualifiedImpressions)} / {formatCompact(campaign.purchasedImpressions)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-[8px] rounded-br-[3px] bg-paper-strong">
        <div className={cn("h-full bg-gradient-to-r", style.heat)} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-line/70 pt-4 text-xs text-muted">
        <span>{campaign.qualifiedClicks} qualified clicks · {campaign.qualifiedImpressions ? ((campaign.qualifiedClicks / campaign.qualifiedImpressions) * 100).toFixed(1) : "0.0"}% CTR</span>
        <Link href={`/dashboard/campaigns/${campaign.id}`} className="inline-flex items-center gap-1 font-black text-ink">
          Details <ArrowUpRight size={14} />
        </Link>
      </div>
    </DeskPlaque>
  );
}
