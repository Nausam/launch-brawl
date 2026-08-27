import Link from "next/link";
import { Compass, Flame, Layers3, type LucideIcon } from "lucide-react";
import type { Category, DiscoveryFilter } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SubmitProductButton } from "@/components/submit/SubmitProductButton";
import { DiscoverFilters } from "@/components/discovery/DiscoverFilters";

const tabs: Array<{ key: DiscoveryFilter; label: string }> = [
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "loved", label: "Most loved" },
  { key: "clicked", label: "Most clicked" },
  { key: "voted", label: "Most voted" },
];

export type DirectoryHeaderStatTone = "coral" | "gold" | "blue";

export type DirectoryHeaderStat = {
  icon: LucideIcon;
  value: string;
  label: string;
  tone: DirectoryHeaderStatTone;
};

function headerStatStyle(tone: DirectoryHeaderStatTone) {
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

function HeaderStat({ icon: Icon, value, label, tone }: DirectoryHeaderStat) {
  const style = headerStatStyle(tone);
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

function discoverTabHref(tab: DiscoveryFilter, activeCategory?: string, activePricing?: string, activeLaunch?: string) {
  const params = new URLSearchParams();
  if (tab !== "trending") params.set("sort", tab);
  if (activeCategory) params.set("category", activeCategory);
  if (activePricing) params.set("pricing", activePricing);
  if (activeLaunch) params.set("launch", activeLaunch);
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}

function directoryTabHref(tab: DiscoveryFilter, arena: boolean, activeCategory?: string, activePricing?: string, activeLaunch?: string) {
  if (arena) return discoverTabHref(tab, activeCategory, activePricing, activeLaunch);
  switch (tab) {
    case "trending":
      return "/trending";
    case "new":
      return "/new";
    case "loved":
      return "/most-loved";
    case "clicked":
    case "voted":
      return discoverTabHref(tab);
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

export function DirectoryHeader({
  active = "trending",
  title,
  description,
  arena = false,
  productCount,
  sponsoredCount,
  categoryCount,
  categories = [],
  activeCategory,
  activePricing,
  activeLaunch,
  stats,
  eyebrow = "Explore the brawl",
  eyebrowIcon: EyebrowIcon = Compass,
}: {
  active?: DiscoveryFilter;
  title: string;
  description: string;
  arena?: boolean;
  productCount?: number;
  sponsoredCount?: number;
  categoryCount?: number;
  categories?: Category[];
  activeCategory?: string;
  activePricing?: string;
  activeLaunch?: string;
  stats?: DirectoryHeaderStat[];
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
}) {
  const headerStats = stats ?? [
    { icon: Layers3, value: String(productCount ?? 0), label: "Products in view", tone: "coral" },
    { icon: Flame, value: String(sponsoredCount ?? 0), label: "Live sponsored", tone: "gold" },
    { icon: Compass, value: String(categoryCount ?? 0), label: "Corners to explore", tone: "blue" },
  ];

  return (
    <div className="relative z-20 overflow-visible">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
            {eyebrow}
            <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
              <EyebrowIcon size={13} />
            </span>
          </div>
          <h1 className="display mt-4 max-w-3xl text-5xl font-black leading-[.95] tracking-[-0.06em] text-ink sm:text-7xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">{description}</p>
        </div>
        <SubmitProductButton variant="dark" size="md" arrow className="self-start lg:self-end">Submit a launch</SubmitProductButton>
      </div>

      {arena ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {headerStats.map((stat) => <HeaderStat key={stat.label} {...stat} />)}
        </div>
      ) : null}

      <div className="mt-8 flex items-center gap-3">
        <div className="scrollbar-hide min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex w-max gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={directoryTabHref(tab.key, arena, activeCategory, activePricing, activeLaunch)}
                className={cn(
                  "shrink-0 rounded-[14px] rounded-br-[6px] border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition",
                  active === tab.key ? "border-ink bg-ink text-white" : "border-line bg-paper text-muted hover:border-ink hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
        {arena ? (
          <DiscoverFilters categories={categories} activeCategory={activeCategory} activePricing={activePricing} activeLaunch={activeLaunch} activeSort={active} />
        ) : null}
      </div>
    </div>
  );
}
