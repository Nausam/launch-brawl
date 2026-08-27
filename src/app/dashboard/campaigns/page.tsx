import { redirect } from "next/navigation";
import { BarChart3, Info, MousePointer2, Radio } from "lucide-react";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { listOwnerCampaigns } from "@/lib/repositories/owner";
import { formatCompact, formatMoney } from "@/lib/utils";
import { CampaignProgress } from "@/components/dashboard/CampaignProgress";
import { EmptyPanel } from "@/components/dashboard/EmptyPanel";
import { ButtonLink } from "@/components/ui/Button";
import { DeskHeader, DeskStat } from "@/components/desk/DeskChrome";

export default async function DashboardCampaignsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  const campaigns = await listOwnerCampaigns(user.id);
  const totalSpend = campaigns.reduce((sum, campaign) => sum + campaign.purchasedAmountCents, 0);
  const totalImpressions = campaigns.reduce((sum, campaign) => sum + campaign.qualifiedImpressions, 0);
  const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.qualifiedClicks, 0);
  return (
    <div>
      <DeskHeader
        kind="owner"
        eyebrow="Delivery yard"
        title="Campaigns keep delivering."
        description="Every paid bid creates an allocation. Follow delivery, clicks, and the placements that brought people through."
        icon={Radio}
        action={<ButtonLink href="/dashboard/products" variant="primary" size="sm" arrow className="self-start uppercase tracking-[0.08em]">Start a new bid</ButtonLink>}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={BarChart3} value={formatMoney(totalSpend)} label="Total spend" tone="gold" />
        <DeskStat icon={Radio} value={formatCompact(totalImpressions)} label="Qualified impressions" tone="coral" />
        <DeskStat icon={MousePointer2} value={formatCompact(totalClicks)} label="Qualified clicks" tone="mint" />
      </div>
      <section className="relative mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
              Delivery rails
            </div>
            <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">All campaign heat</h2>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.12em] text-muted">{campaigns.length} rails</span>
        </div>
        <div className="mt-4 grid gap-3">
          {campaigns.length
            ? campaigns.map((campaign) => <CampaignProgress key={campaign.id} campaign={campaign} />)
            : <EmptyPanel title="No campaigns on this account" body="When a bid is confirmed, its promotional allocation and delivery will live here." href="/#daily-brawl" action="See today’s brawl" />}
        </div>
      </section>
      <p className="mt-8 flex items-start gap-3 text-xs leading-5 text-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-coral" />
        Promotional impressions are delivered through available Launch Brawl inventory until your allocation is fulfilled. We do not promise a delivery speed or guaranteed sales.
      </p>
    </div>
  );
}
