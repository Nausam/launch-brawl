"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Flame, Gauge, ShieldAlert, Sparkles, Swords, Target, Trophy, X, type LucideIcon } from "lucide-react";
import type { Brawl, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BrawlCard } from "@/components/brawls/BrawlCard";
import { Button } from "@/components/ui/Button";

export type ArenaLane = "live" | "close" | "upsets" | "boss" | "hot" | "starting" | "recent";

export function laneMeta(lane: ArenaLane): { title: string; eyebrow: string; icon: LucideIcon } {
  switch (lane) {
    case "live":
      return { title: "Live now", eyebrow: "The arena is open", icon: Flame };
    case "close":
      return { title: "Too close to call", eyebrow: "Every vote matters", icon: Gauge };
    case "upsets":
      return { title: "Upsets", eyebrow: "Expected result: challenged", icon: ShieldAlert };
    case "boss":
      return { title: "Boss brawls", eyebrow: "Category power", icon: Trophy };
    case "hot":
      return { title: "Hot brawls", eyebrow: "Organic momentum", icon: Flame };
    case "starting":
      return { title: "Starting soon", eyebrow: "Next on deck", icon: Clock3 };
    case "recent":
      return { title: "Recent results", eyebrow: "The record book", icon: Swords };
    default: {
      const _exhaustive: never = lane;
      return _exhaustive;
    }
  }
}

function laneStyle(lane: ArenaLane) {
  switch (lane) {
    case "live":
      return "border-coral/30 bg-coral/10 text-coral";
    case "close":
      return "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]";
    case "upsets":
      return "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]";
    case "boss":
      return "border-ink bg-ink text-white";
    case "hot":
      return "border-[#f4c788] bg-[#fff4d6] text-[#c24b2a]";
    case "starting":
      return "border-[#c5b8ea] bg-[#efe8fb] text-[#5f48b6]";
    case "recent":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    default: {
      const _exhaustive: never = lane;
      return _exhaustive;
    }
  }
}

export function ArenaSection({ lane, brawls, products }: { lane: ArenaLane; brawls: Brawl[]; products: Product[] }) {
  if (brawls.length === 0) return null;
  const productMap = new Map(products.map((product) => [product.id, product]));
  const meta = laneMeta(lane);
  const Icon = meta.icon;
  const compact = lane !== "live";

  return (
    <section id={lane} className="scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className={cn("inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]", laneStyle(lane))}>
            {meta.title}
            <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-white/20">
              <Icon size={13} />
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">{meta.eyebrow}</p>
        </div>
        <span className="text-xs font-bold text-muted">
          {brawls.length} {brawls.length === 1 ? "matchup" : "matchups"}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {brawls.map((brawl) => {
          const left = productMap.get(brawl.productAId ?? brawl.leftProductId);
          const right = productMap.get(brawl.productBId ?? brawl.rightProductId);
          return left && right ? <BrawlCard key={brawl.id} brawl={brawl} left={left} right={right} compact={compact} /> : null;
        })}
      </div>
    </section>
  );
}

export function HowItWorksButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  return <>
    <Button type="button" onClick={() => setOpen(true)} variant="dark" size="md" arrow>How it works</Button>
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/35 p-4 backdrop-blur-[1px] sm:p-8">
      <div className="flex min-h-full items-center justify-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="brawl-how-it-works-title" className="noise w-full max-w-4xl overflow-hidden rounded-[14px] rounded-br-[6px] border border-line bg-paper text-ink">
        <div className="flex items-start justify-between gap-6 border-b border-line bg-paper-strong/35 px-7 py-7 sm:px-10 sm:py-8">
          <div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] rounded-br-[5px] bg-coral text-white"><Swords size={17} /></span><div><div className="eyebrow text-coral">Brawl arena · playbook</div><h2 id="brawl-how-it-works-title" className="display mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">How Brawls work.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Two launches. One community signal. A record that stays useful after the matchup ends.</p></div></div>
          <Button type="button" onClick={() => setOpen(false)} variant="icon" size="icon" icon={<X size={17} />} className="h-9 w-9 shrink-0" aria-label="Close how Brawls work dialog" />
        </div>

        <div className="border-b border-line px-7 py-7 sm:px-10 sm:py-8"><div className="flex items-baseline justify-between gap-4"><div className="eyebrow text-coral">How the signal moves</div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">03 steps</span></div><div className="mt-6 grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <HowItWorksStep number="01" icon={<Target size={17} />} title="Pick a side" body="Two published products meet in one focused matchup." />
          <HowItWorksStep number="02" icon={<Check size={17} />} title="Cast your vote" body="Your vote moves the live split. Paid reach never changes it." />
          <HowItWorksStep number="03" icon={<Gauge size={17} />} title="Read what moved" body="Results shape ratings, records, streaks, and seasons." />
        </div></div>

        <div className="border-b border-line px-7 py-7 sm:px-10 sm:py-8"><div className="flex items-baseline justify-between gap-4"><div><div className="eyebrow text-coral">Read the board</div><h3 className="display mt-2 text-2xl font-black tracking-[-0.04em]">Every matchup has a story.</h3></div><span className="hidden text-xs font-bold text-muted sm:inline">Four ways to read the signal</span></div><div className="mt-6 grid gap-x-12 sm:grid-cols-2">
          <HowItWorksNote icon={<Flame size={17} />} title="Too close to call" body="Find live matchups separated by three points or less." />
          <HowItWorksNote icon={<ShieldAlert size={17} />} title="Upset watch" body="See lower-rated products challenge the expected result." />
          <HowItWorksNote icon={<Trophy size={17} />} title="Season standings" body="Products climb organic category leagues and earn their division." />
          <HowItWorksNote icon={<Gauge size={17} />} title="Brawl Power" body="Compare ratings, records, streaks, and momentum." />
        </div></div>

        <div className="bg-paper-strong/35 px-7 py-7 sm:px-10 sm:py-8"><div className="flex items-baseline justify-between gap-4"><div className="eyebrow text-coral">How prediction works</div><span className="hidden text-xs font-bold text-muted sm:inline">Separate from the community vote</span></div><h3 className="display mt-2 text-2xl font-black tracking-[-0.04em]">Make a call before the final stretch.</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-muted">Prediction is a separate layer. It does not move the live split; it records which product you think will win.</p><div className="mt-6 grid gap-7 sm:grid-cols-3 sm:divide-x sm:divide-line">
          <HowItWorksRule icon={<Target size={16} />} title="Choose a product" body="Pick the launch you expect to take the matchup." />
          <HowItWorksRule icon={<Clock3 size={16} />} title="Save before lock" body="Predictions close at 80% of the board window, before the final stretch." />
          <HowItWorksRule icon={<Sparkles size={16} />} title="Build your record" body="Correct calls improve prediction accuracy and streaks. Draws are voided." />
        </div><p className="mt-7 border-t border-line pt-5 text-xs leading-5 text-muted">You can make one prediction per Brawl. Saving it never changes votes, ratings, or the final outcome.</p></div>
      </section>
      </div>
    </div>}
  </>;
}

function HowItWorksStep({ number, icon, title, body }: { number: string; icon: React.ReactNode; title: string; body: string }) {
  return <div className="py-5 first:pt-0 last:pb-0 sm:px-7 sm:py-2 sm:first:pl-0 sm:last:pr-0"><div className="flex items-center gap-2"><span className="eyebrow text-coral">{number}</span><span className="text-coral">{icon}</span></div><h3 className="display mt-4 text-lg font-black tracking-[-0.03em]">{title}</h3><p className="mt-2 text-xs leading-5 text-muted">{body}</p></div>;
}

function HowItWorksNote({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="flex items-start gap-3 border-t border-line py-5"><span className="mt-0.5 shrink-0 text-coral">{icon}</span><div><p className="text-sm font-black">{title}</p><p className="mt-2 text-xs leading-5 text-muted">{body}</p></div></div>;
}

function HowItWorksRule({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="flex items-start gap-3 sm:px-7 first:pl-0 last:pr-0"><span className="mt-0.5 inline-flex shrink-0 text-coral">{icon}</span><div><p className="text-sm font-black">{title}</p><p className="mt-2 text-xs leading-5 text-muted">{body}</p></div></div>;
}

export function ArenaBadges({ close, upset }: { close: boolean; upset: boolean }) { return <div className="flex flex-wrap gap-2">{close && <span className="inline-flex items-center gap-1 rounded-full bg-butter px-2.5 py-1 text-[10px] font-black text-ink"><Flame size={12} />TOO CLOSE</span>}{upset && <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-[10px] font-black text-coral"><ShieldAlert size={12} />UPSET</span>}</div>; }
