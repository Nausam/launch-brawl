"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Gavel, LayoutDashboard, Package, Settings, ShieldCheck, Sparkles, Tags, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { rankStyle, type RankTone } from "@/components/desk/DeskChrome";

type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};

type NavOrientation = "rail" | "tape";
type DeskKind = "owner" | "admin";

const ownerGroups: NavGroup[] = [
  {
    id: "bench",
    label: "Bench",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "My products", href: "/dashboard/products", icon: Package },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    items: [
      { label: "Campaigns", href: "/dashboard/campaigns", icon: BarChart3 },
      { label: "Bids", href: "/dashboard/bids", icon: Gavel },
    ],
  },
  {
    id: "signal",
    label: "Signal",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    id: "intake",
    label: "Intake",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: Tags },
    ],
  },
  {
    id: "arena",
    label: "Arena",
    items: [
      { label: "Brawls", href: "/admin/brawls", icon: ShieldCheck },
      { label: "Seasons", href: "/admin/seasons", icon: Sparkles },
      { label: "Quests", href: "/admin/quests", icon: Sparkles },
      { label: "Bounties", href: "/admin/bounties", icon: Gavel },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    items: [
      { label: "Deals", href: "/admin/deals", icon: Tags },
      { label: "Bids", href: "/admin/bids", icon: Gavel },
      { label: "Campaigns", href: "/admin/campaigns", icon: BarChart3 },
      { label: "Rounds", href: "/admin/rounds", icon: Sparkles },
    ],
  },
  {
    id: "systems",
    label: "Systems",
    items: [
      { label: "Brawl health", href: "/admin/gamification", icon: ShieldCheck },
      { label: "Audit logs", href: "/admin/audit", icon: ShieldCheck },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

function groupTone(kind: DeskKind, groupIndex: number): RankTone {
  if (kind === "owner") {
    if (groupIndex === 0) return "gold";
    if (groupIndex === 1) return "bronze";
    return "silver";
  }
  if (groupIndex === 0) return "bronze";
  if (groupIndex === 1) return "gold";
  if (groupIndex === 2) return "silver";
  return "rest";
}

function navFrame(orientation: NavOrientation) {
  switch (orientation) {
    case "rail":
      return "mt-8 grid gap-6";
    case "tape":
      return "flex w-max gap-5";
    default: {
      const _exhaustive: never = orientation;
      return _exhaustive;
    }
  }
}

function itemLink(orientation: NavOrientation, kind: DeskKind, active: boolean) {
  switch (orientation) {
    case "rail":
      return cn(
        "flex items-center gap-3 rounded-[16px] rounded-br-[7px] border px-2.5 py-2 text-sm font-bold transition",
        active
          ? kind === "admin"
            ? "border-ink bg-ink text-white shadow-[0_10px_24px_rgba(20,33,43,.18)]"
            : "border-coral-dark bg-coral text-white shadow-[0_10px_24px_rgba(255,107,74,.28)]"
          : "border-transparent text-muted hover:border-line hover:bg-paper-strong hover:text-ink",
      );
    case "tape":
      return cn(
        "inline-flex shrink-0 items-center gap-2 rounded-[14px] rounded-br-[6px] border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition",
        active
          ? kind === "admin"
            ? "border-ink bg-ink text-white"
            : "border-coral-dark bg-coral text-white"
          : "border-line bg-paper text-muted hover:border-ink hover:text-ink",
      );
    default: {
      const _exhaustive: never = orientation;
      return _exhaustive;
    }
  }
}

function iconTile(orientation: NavOrientation, kind: DeskKind, active: boolean, tone: RankTone) {
  const enamel = rankStyle(tone);
  switch (orientation) {
    case "rail":
      return cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border",
        active
          ? kind === "admin"
            ? enamel.medal
            : "border-white/30 bg-white/15 text-white"
          : enamel.medal,
      );
    case "tape":
      return cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-[10px] rounded-br-[4px] border",
        active ? "border-white/30 bg-white/15 text-white" : enamel.medal,
      );
    default: {
      const _exhaustive: never = orientation;
      return _exhaustive;
    }
  }
}

export function DashboardNav({ admin = false, orientation = "rail" }: { admin?: boolean; orientation?: NavOrientation }) {
  const pathname = usePathname();
  const kind: DeskKind = admin ? "admin" : "owner";
  const groups = admin ? adminGroups : ownerGroups;
  const homeHref = groups[0]?.items[0]?.href;

  return (
    <nav className={navFrame(orientation)} aria-label={admin ? "Admin desk" : "Workspace"}>
      {groups.map((group, groupIndex) => {
        const tone = groupTone(kind, groupIndex);
        return (
          <div key={group.id} className={orientation === "tape" ? "flex items-center gap-2" : "grid gap-1"}>
            <p className={cn("px-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted", orientation === "tape" && "shrink-0")}>{group.label}</p>
            <div className={orientation === "tape" ? "flex gap-2" : "grid gap-1"}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.href === homeHref ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={itemLink(orientation, kind, active)}>
                    <span className={iconTile(orientation, kind, active, tone)}>
                      <Icon size={orientation === "rail" ? 14 : 12} />
                    </span>
                    <span className={orientation === "rail" ? "truncate" : undefined}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
