import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, BarChart3, Globe2, MousePointer2, Radio, Users } from "lucide-react";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { findOwnerCampaign, reachSeriesFromCampaigns } from "@/lib/repositories/owner";
import { calculateCpc, calculateCtr, formatCompact, formatMoney } from "@/lib/utils";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { CampaignProgress } from "@/components/dashboard/CampaignProgress";
import { DeskHeader, DeskPlaque, DeskStat } from "@/components/desk/DeskChrome";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Campaign ${id}` };
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;
  const campaign = await findOwnerCampaign(user.id, id);
  if (!campaign) notFound();
  const ctr = calculateCtr(campaign.qualifiedClicks, campaign.qualifiedImpressions);
  const chartData = await reachSeriesFromCampaigns([campaign]);
  return (
    <div>
      <DeskHeader
        kind="owner"
        eyebrow="Delivery console"
        title={campaign.productName}
        description={`A transparent view of the reach attached to bid ${campaign.bidId}.`}
        icon={Radio}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={BarChart3} value={formatMoney(campaign.purchasedAmountCents)} label="Spent" tone="gold" />
        <DeskStat icon={Users} value={formatCompact(campaign.qualifiedImpressions)} label="Qualified impressions" tone="coral" />
        <DeskStat icon={MousePointer2} value={formatCompact(campaign.qualifiedClicks)} label="Qualified clicks" tone="mint" />
        <DeskStat icon={ArrowUpRight} value={formatMoney(calculateCpc(campaign.purchasedAmountCents, campaign.qualifiedClicks))} label="Effective CPC" tone="blue" />
      </div>
      <div className="relative mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-ink bg-ink p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-coral">Delivery curve</p>
              <h2 className="display mt-2 text-2xl font-black">Impressions & clicks</h2>
            </div>
            <span className="rounded-[12px] rounded-br-[5px] border border-white/20 bg-white/10 px-3 py-1 text-xs font-black">{ctr.toFixed(1)}% CTR</span>
          </div>
          {chartData.length ? (
            <div className="mt-7"><AnalyticsChart data={chartData} /></div>
          ) : (
            <p className="mt-7 rounded-[16px] rounded-br-[7px] border border-dashed border-white/20 px-6 py-10 text-center text-sm text-white/65">No daily delivery events have been recorded for this campaign.</p>
          )}
        </section>
        <aside className="grid gap-3 self-start">
          <CampaignProgress campaign={campaign} />
          <DeskPlaque tone="silver">
            <Globe2 size={16} className="text-coral" />
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-muted">Status</p>
            <p className="mt-1 text-sm font-black">{campaign.status.toLowerCase()}</p>
          </DeskPlaque>
          <DeskPlaque tone="rest">
            <Users size={16} className="text-coral" />
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-muted">Allocated</p>
            <p className="mt-1 text-sm font-black">{formatCompact(campaign.purchasedImpressions)}</p>
          </DeskPlaque>
          <DeskPlaque tone="gold">
            <MousePointer2 size={16} className="text-[#7f570b]" />
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#a26d08]">Qualified rate</p>
            <p className="mt-1 text-sm font-black">{campaign.clicks ? `${((campaign.qualifiedClicks / campaign.clicks) * 100).toFixed(1)}%` : "—"}</p>
          </DeskPlaque>
        </aside>
      </div>
      <p className="mt-8 flex items-center gap-2 text-xs text-muted">
        <span className="h-2 w-2 rounded-full bg-mint" />
        Qualified events filter crawlers, rapid repeats, and duplicate session activity before counting toward delivery.
      </p>
    </div>
  );
}
