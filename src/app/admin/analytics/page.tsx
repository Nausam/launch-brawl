import { BarChart3, MousePointer2, Radio, Gavel } from "lucide-react";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { getAdminMetrics, getPlatformDailySeries } from "@/lib/repositories/admin";
import { formatCompact } from "@/lib/utils";
import { DeskEmpty, DeskHeader, DeskStat } from "@/components/desk/DeskChrome";

export default async function AdminAnalyticsPage() {
  const [metrics, series] = await Promise.all([getAdminMetrics(), getPlatformDailySeries()]);
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Signal board"
        title="What the ledger actually recorded."
        description="Aggregated campaign and organic ecosystem metrics from Firestore event counters."
        icon={BarChart3}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Radio} value={formatCompact(metrics.impressions)} label="Recorded impressions" tone="gold" />
        <DeskStat icon={MousePointer2} value={formatCompact(metrics.clicks)} label="Recorded clicks" tone="coral" />
        <DeskStat icon={BarChart3} value={formatCompact(metrics.activeCampaigns)} label="Active campaigns" tone="mint" />
        <DeskStat icon={Gavel} value={formatCompact(metrics.paidBids)} label="Paid bids" tone="blue" />
      </div>
      <section className="relative mt-8 overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-ink bg-ink p-6 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-coral">Campaign delivery</p>
        <h2 className="display mt-2 text-2xl font-black">Daily impressions and clicks</h2>
        <p className="mt-2 text-sm text-white/65">Only aggregated Firestore event data is shown here.</p>
        {series.length ? (
          <div className="mt-6"><AnalyticsChart data={series} /></div>
        ) : (
          <div className="mt-6">
            <DeskEmpty title="No campaign events have been recorded yet." body="Qualified impressions and clicks will draw this curve once delivery starts." />
          </div>
        )}
      </section>
    </div>
  );
}
