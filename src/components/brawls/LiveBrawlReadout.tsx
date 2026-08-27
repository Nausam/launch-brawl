"use client";

import { useEffect, useMemo, useState } from "react";
import type { Brawl, Product } from "@/lib/types";

export function LiveBrawlReadout({ initialBrawl, left, right }: { initialBrawl: Brawl; left: Product; right: Product }) {
  const [brawl, setBrawl] = useState(initialBrawl);
  useEffect(() => {
    if (initialBrawl.status !== "LIVE") return;
    let active = true;
    const refresh = async () => { if (document.visibilityState !== "visible") return; const response = await fetch(`/api/brawls/${initialBrawl.id}/snapshot`, { cache: "no-store" }).catch(() => null); if (!response?.ok || !active) return; const payload = await response.json().catch(() => null) as { brawl?: Brawl } | null; if (payload?.brawl) setBrawl(payload.brawl); };
    const interval = window.setInterval(() => void refresh(), 15_000);
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, [initialBrawl.id, initialBrawl.status]);
  const totalVotes = Math.max(1, brawl.leftVotes + brawl.rightVotes);
  const leftPercent = Math.round((brawl.leftVotes / totalVotes) * 1000) / 10;
  const rightPercent = Math.round((brawl.rightVotes / totalVotes) * 1000) / 10;
  const leftLabel = useMemo(() => Number.isInteger(leftPercent) ? String(leftPercent) : leftPercent.toFixed(1), [leftPercent]);
  const rightLabel = useMemo(() => Number.isInteger(rightPercent) ? String(rightPercent) : rightPercent.toFixed(1), [rightPercent]);
  return <div aria-live="polite"><div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4"><div><span className="display block text-4xl font-black leading-none text-[#f27d1d] sm:text-5xl">{leftLabel}%</span><span className="mt-2 block text-xs font-black text-ink">{left.name}</span></div><div className="pb-1 text-center"><span className="eyebrow text-muted">Live split</span><span className="mt-1 block text-xs font-bold text-muted">{(brawl.totalVotes ?? totalVotes).toLocaleString()} votes</span></div><div className="text-right"><span className="display block text-4xl font-black leading-none text-[#b36f39] sm:text-5xl">{rightLabel}%</span><span className="mt-2 block text-xs font-black text-ink">{right.name}</span></div></div><div className="relative mt-5 h-3 overflow-hidden rounded-full bg-[#eef0ee]"><span className="absolute inset-y-0 left-0 rounded-l-full transition-[width]" style={{ width: `${leftPercent}%`, backgroundColor: left.color }} /><span className="absolute inset-y-0 right-0 rounded-r-full transition-[width]" style={{ width: `${rightPercent}%`, backgroundColor: right.color }} /><span className="absolute inset-y-0 left-1/2 w-px bg-ink/60" /></div></div>;
}
