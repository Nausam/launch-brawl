"use client";

import Link from "next/link";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Category, DiscoveryFilter } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const sortOptions: Array<{ key: DiscoveryFilter; label: string }> = [
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "loved", label: "Most loved" },
  { key: "clicked", label: "Organic clicks" },
  { key: "voted", label: "Most voted" },
];

const pricingOptions = ["Free", "Freemium", "Paid", "Open source"] as const;
const launchOptions = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "upcoming", label: "Upcoming" },
  { key: "recent", label: "Recently launched" },
] as const;

function chipClass(active: boolean, tone: "ink" | "coral") {
  switch (tone) {
    case "ink":
      return active
        ? "border-ink bg-ink text-white"
        : "border-line bg-paper text-muted hover:border-ink hover:text-ink";
    case "coral":
      return active
        ? "border-coral bg-coral text-white"
        : "border-line bg-paper text-muted hover:border-coral hover:text-coral";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export function DiscoverFilters({
  categories,
  activeCategory,
  activeSort = "trending",
  activePricing,
  activeLaunch,
}: {
  categories: Category[];
  activeCategory?: string;
  activeSort?: string;
  activePricing?: string;
  activeLaunch?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = categories.find((category) => category.slug === activeCategory);
  const hrefFor = (category = activeCategory, pricing = activePricing, launch = activeLaunch, sort = activeSort) => {
    const params = new URLSearchParams();
    if (sort !== "trending") params.set("sort", sort);
    if (category) params.set("category", category);
    if (pricing) params.set("pricing", pricing);
    if (launch) params.set("launch", launch);
    const query = params.toString();
    return `/discover${query ? `?${query}` : ""}`;
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative z-30">
      <Button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)} variant="outline" size="sm" icon={<SlidersHorizontal size={13} />} className="cursor-pointer bg-paper/75 font-bold text-muted hover:text-ink">
        <span>Filters</span>
        {selected ? <span className="hidden max-w-24 truncate border-l border-line pl-2 text-ink sm:inline">{selected.name}</span> : null}
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </Button>
      {open ? (
        <div role="menu" className="absolute right-0 top-[calc(100%+0.65rem)] z-50 max-h-[min(32rem,calc(100vh-8rem))] w-[min(29rem,calc(100vw-2.5rem))] overflow-y-auto overflow-x-hidden rounded-[24px] rounded-br-[10px] border-2 border-[#c9d7e4] bg-paper p-4 shadow-[0_18px_50px_rgba(20,33,43,.12)]">
          <div className="flex items-end justify-between gap-4 pb-3">
            <div>
              <div className="eyebrow text-coral">Directory filters</div>
              <p className="mt-1 text-sm font-bold text-ink">Browse by category</p>
            </div>
            <span className="rounded-[10px] rounded-br-[4px] border border-line bg-paper-strong px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted">{categories.length} signals</span>
          </div>
          <div className="grid gap-4 border-t border-line pt-3">
            <div>
              <p className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted">Sort</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sortOptions.map((item) => (
                  <Link key={item.key} role="menuitem" href={hrefFor(activeCategory, activePricing, activeLaunch, item.key)} onClick={() => setOpen(false)} className={cn("rounded-[12px] rounded-br-[5px] border px-2.5 py-1.5 text-[11px] font-bold", chipClass(activeSort === item.key, "ink"))}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted">Pricing</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pricingOptions.map((pricing) => (
                  <Link key={pricing} role="menuitem" href={hrefFor(activeCategory, pricing, activeLaunch)} onClick={() => setOpen(false)} className={cn("rounded-[12px] rounded-br-[5px] border px-2.5 py-1.5 text-[11px] font-bold", chipClass(activePricing === pricing, "coral"))}>
                    {pricing}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted">Launch window</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {launchOptions.map((item) => (
                  <Link key={item.key} role="menuitem" href={hrefFor(activeCategory, activePricing, item.key)} onClick={() => setOpen(false)} className={cn("rounded-[12px] rounded-br-[5px] border px-2.5 py-1.5 text-[11px] font-bold", chipClass(activeLaunch === item.key, "coral"))}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 border-t border-line pt-3">
              <Link role="menuitem" href={hrefFor(undefined, activePricing, activeLaunch)} onClick={() => setOpen(false)} className={cn("col-span-2 flex items-center gap-3 rounded-[14px] rounded-br-[6px] border px-2.5 py-3 text-sm font-bold transition hover:bg-paper-strong/45", selected ? "border-line text-ink" : "border-coral/30 bg-coral/5 text-coral")}>
                <span className="grid h-7 w-7 place-items-center rounded-[8px] rounded-br-[4px] bg-ink text-[11px] text-white">✦</span>
                <span className="flex-1">All launches</span>
                {!selected ? <Check size={15} /> : null}
              </Link>
              {categories.map((category) => {
                const isSelected = selected?.id === category.id;
                return (
                  <Link role="menuitem" key={category.id} href={hrefFor(category.slug, activePricing, activeLaunch)} onClick={() => setOpen(false)} aria-current={isSelected ? "page" : undefined} className={cn("group/item flex items-center gap-2.5 rounded-[14px] rounded-br-[6px] border px-2.5 py-3 transition hover:bg-paper-strong/45", isSelected ? "border-coral/30 bg-paper-strong/35" : "border-line")}>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] rounded-br-[4px] border-l-2 text-xs font-bold text-muted" style={{ borderColor: category.accent }}>{category.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink group-hover/item:text-coral">{category.name}</span>
                    {isSelected ? <Check size={14} className="shrink-0 text-coral" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
          <p className="px-1 pt-3 text-[11px] leading-5 text-muted">Choose a category to filter this board in place. The tabs above switch discovery signals.</p>
        </div>
      ) : null}
    </div>
  );
}
