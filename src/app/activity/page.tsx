import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Radio, Swords, type LucideIcon } from "lucide-react";
import { getProductsByIds } from "@/lib/repositories/catalog";
import { listPublicActivity } from "@/lib/repositories/competitive";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { ActivityTapeBoard, tapeJumps, windowForEvent } from "@/components/activity/ActivityTapeBoard";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Live Activity", description: "A privacy-filtered stream of public Launch Brawl activity." };
export const dynamic = "force-dynamic";

type ActivityStatTone = "coral" | "gold" | "blue";

function activityStatStyle(tone: ActivityStatTone) {
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
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function ActivityStat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string; label: string; tone: ActivityStatTone }) {
  const style = activityStatStyle(tone);
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

export default async function ActivityPage() {
  const events = await listPublicActivity(50);
  const products = await getProductsByIds(events.flatMap((event) => (event.productId ? [event.productId] : [])));
  const uniqueProducts = new Set(events.map((event) => event.productId).filter(Boolean)).size;
  const now = Date.now();
  const lastDay = events.filter((event) => now - new Date(event.createdAt).getTime() < 86_400_000).length;
  const jumps = tapeJumps.filter((jump) => events.some((event) => windowForEvent(event.createdAt, now) === jump.key));

  return (
    <>
      <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -left-[28%] -top-52 h-[500px] w-[156%] rounded-[50%] border-[18px] border-[#eef3f8]" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full border-[32px] border-coral/10" />
        <PageContainer className="relative pt-14 pb-3 lg:pt-20 lg:pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
                Public signal
                <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                  <Radio size={13} />
                </span>
              </div>
              <h1 className="display mt-4 max-w-3xl text-5xl font-black leading-[.95] tracking-[-0.06em] text-ink sm:text-7xl">The arena never sleeps.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">A privacy-filtered tape of public wins, streaks, bounties, and season movement. Private votes and personal notifications never appear here.</p>
            </div>
            <ButtonLink href="/brawls" variant="dark" size="md" arrow>
              Open the arena
            </ButtonLink>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ActivityStat icon={Radio} value={String(events.length)} label="Signals on tape" tone="coral" />
            <ActivityStat icon={Swords} value={String(uniqueProducts)} label="Products in view" tone="gold" />
            <ActivityStat icon={Flame} value={String(lastDay)} label="Last 24 hours" tone="blue" />
          </div>

          {jumps.length ? (
            <div className="mt-8 flex items-center gap-3">
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
          ) : null}
        </PageContainer>
      </section>
      <ActivityTapeBoard events={events} products={products} />
    </>
  );
}
