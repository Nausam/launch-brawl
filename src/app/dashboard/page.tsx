import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Gavel, MousePointer2, Package, Radio, type LucideIcon } from "lucide-react";
import { getCurrentRound, getLeaderboard } from "@/lib/repositories/catalog";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { listOwnerCampaigns, listOwnerNotifications, listOwnerProducts, reachSeriesFromCampaigns } from "@/lib/repositories/owner";
import { calculateCtr, cn, formatCompact } from "@/lib/utils";
import { OwnerWorkshopBoard } from "@/components/dashboard/OwnerWorkshopBoard";
import { SubmitProductButton } from "@/components/submit/SubmitProductButton";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workspace" };

type Daypart = "morning" | "afternoon" | "evening";
type WorkshopStatTone = "coral" | "gold" | "blue" | "mint";

function daypartForHour(hour: number): Daypart {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function greetingFor(part: Daypart) {
  switch (part) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    default: {
      const _exhaustive: never = part;
      return _exhaustive;
    }
  }
}

function workshopStatStyle(tone: WorkshopStatTone) {
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

function WorkshopStat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string; label: string; tone: WorkshopStatTone }) {
  const style = workshopStatStyle(tone);
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

const workshopJumps = [
  { key: "launches", label: "Launches" },
  { key: "delivery", label: "Delivery" },
  { key: "reach", label: "Reach" },
  { key: "inbox", label: "Inbox" },
] as const;

export default async function DashboardPage() {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) redirect("/sign-in");

  const user = await getCurrentAppUser();
  if (!user) {
    return (
      <section className="relative">
        <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral">
          Workspace unavailable
        </div>
        <h1 className="display mt-4 max-w-2xl text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">Your session is active, but your workspace did not load.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">The account record could not be read from the application database. Refresh after the Firestore connection or permissions are restored.</p>
        <ButtonLink href="/" variant="primary" size="sm" arrow className="mt-7 uppercase tracking-[0.08em]">Back to Launch Brawl</ButtonLink>
      </section>
    );
  }

  const [products, campaigns, notifications] = await Promise.all([
    listOwnerProducts(user.id),
    listOwnerCampaigns(user.id),
    listOwnerNotifications(user.id),
  ]);
  const round = await getCurrentRound();
  const leaderboard = await getLeaderboard(round);
  const leader = leaderboard[0];
  const activeCampaigns = campaigns.filter((campaign) => campaign.status !== "COMPLETED" && campaign.status !== "EXPIRED" && campaign.status !== "REFUNDED");
  const clicks = campaigns.reduce((sum, campaign) => sum + campaign.qualifiedClicks, 0);
  const impressions = campaigns.reduce((sum, campaign) => sum + campaign.qualifiedImpressions, 0);
  const chartData = campaigns.length ? await reachSeriesFromCampaigns(campaigns) : [];
  const greeting = `${greetingFor(daypartForHour(new Date().getHours()))}, ${user.displayName}.`;
  const jumps = [
    ...(round && leader ? [{ key: "board", label: "Live board" }] : []),
    ...workshopJumps,
  ];

  return (
    <>
      <section className="noise relative border-b border-line pb-3">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-[20%] -top-40 h-[380px] w-[120%] rounded-[50%] border-[14px] border-[#eef3f8]" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full border-[24px] border-coral/10" />
        </div>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              Owner workspace
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Package size={13} />
              </span>
            </div>
            <h1 className="display mt-4 max-w-3xl text-4xl font-black leading-[.95] tracking-[-0.05em] text-ink sm:text-6xl">{greeting}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              {products.length || campaigns.length
                ? "The live signal behind your launches — listings, delivery, and the inbox for this account."
                : "Submit a product to start collecting votes, bids, and campaign delivery."}
            </p>
          </div>
          <SubmitProductButton variant="primary" size="md" arrow icon={<Package size={16} />} className="self-start uppercase tracking-[0.08em]">
            Add a product
          </SubmitProductButton>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3">
          <WorkshopStat icon={Package} value={String(products.length)} label="Your products" tone="coral" />
          <WorkshopStat icon={Gavel} value={String(activeCampaigns.length)} label="Active campaigns" tone="gold" />
          <WorkshopStat icon={Radio} value={formatCompact(impressions)} label="Qualified impressions" tone="mint" />
          <WorkshopStat icon={MousePointer2} value={formatCompact(clicks)} label={`${calculateCtr(clicks, impressions).toFixed(1)}% blended CTR`} tone="blue" />
        </div>

        <div className="relative mt-7 flex items-center gap-3">
          <div className="scrollbar-hide min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex w-max gap-2">
              {jumps.map((jump, index) => (
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

      <OwnerWorkshopBoard
        products={products}
        campaigns={activeCampaigns}
        notifications={notifications}
        chartData={chartData}
        round={round}
        leader={leader}
      />
    </>
  );
}
