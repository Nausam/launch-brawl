"use client";

import Image from "next/image";
import { ArrowUpRight, Check, Clock3, Crown, Swords, Users, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Brawl, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductLogo } from "@/components/products/ProductLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { BrawlVoteModal } from "@/components/brawls/BrawlVoteModal";

type BrawlCardTone = "live" | "upcoming";
type BrawlSide = "left" | "right";

function brawlStyle(tone: BrawlCardTone) {
  switch (tone) {
    case "live":
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#f8f6f1_42%,#ffffff_100%)] shadow-[0_16px_40px_rgba(201,148,32,.14)]",
        bar: "from-[#fff1b8] via-[#f0c54a] to-[#ff6b4a]",
        wash: "bg-[#fff0bd]/55",
        badge: "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]",
        tile: "border-[#4d3a14]/20 bg-[#4d3a14]/10",
        clock: "text-coral",
        label: "Live brawl",
      };
    case "upcoming":
      return {
        frame: "border-[#c5b8ea] bg-[linear-gradient(135deg,#f3eefc_0%,#f8f6f1_42%,#ffffff_100%)] shadow-[0_16px_40px_rgba(124,92,219,.12)]",
        bar: "from-[#e7e0f7] via-[#9b86d8] to-[#7c5cdb]",
        wash: "bg-[#e9e3fa]/65",
        badge: "border-[#c5b8ea] bg-[#efe8fb] text-[#5f48b6]",
        tile: "border-[#5f48b6]/20 bg-[#5f48b6]/10",
        clock: "text-[#7c5cdb]",
        label: "Coming up",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function optionStyle(side: BrawlSide) {
  switch (side) {
    case "left":
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#ffffff_100%)]",
        selected: "bg-[#fff7e8] shadow-[0_12px_28px_rgba(201,148,32,.16)]",
        ring: "border-[#f0bd72]",
        logoRing: "ring-[#f2c27e]",
        eyebrow: "text-[#c27c1a]",
        percent: "text-[#f27d1d]",
        label: "Challenger",
      };
    case "right":
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(135deg,#eef6fc_0%,#ffffff_100%)]",
        selected: "bg-[#f2f8fd] shadow-[0_12px_28px_rgba(80,130,170,.14)]",
        ring: "border-[#b7d2e7]",
        logoRing: "ring-[#b7d2e7]",
        eyebrow: "text-[#5d86a8]",
        percent: "text-[#b36f39]",
        label: "Defender",
      };
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

function voteCta(live: boolean, voted: boolean): { label: string; icon: ReactNode } {
  if (voted) return { label: "Vote counted", icon: <Check size={15} /> };
  if (live) return { label: "Vote now · +2 XP", icon: <Zap size={15} fill="currentColor" /> };
  return { label: "View matchup", icon: <ArrowUpRight size={15} /> };
}

export function BrawlCard({ brawl, left, right, compact = false }: { brawl: Brawl; left: Product; right: Product; compact?: boolean }) {
  const [choice, setChoice] = useState<"left" | "right" | null>(null);
  const [voted, setVoted] = useState(false);
  const [predictionSaved, setPredictionSaved] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState({ left: brawl.leftVotes, right: brawl.rightVotes });
  const total = Math.max(voteCounts.left + voteCounts.right, 1);
  const leftPercent = Math.round((voteCounts.left / total) * 100);
  const rightPercent = 100 - leftPercent;
  const live = brawl.status === "LIVE";
  const tone: BrawlCardTone = live ? "live" : "upcoming";
  const style = brawlStyle(tone);
  const totalVotes = voteCounts.left + voteCounts.right;
  const cta = voteCta(live, voted);

  const choose = (side: "left" | "right") => {
    setChoice(side);
    setMessage(null);
  };

  return (
    <>
      <article className={cn("relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 text-ink", compact ? "px-4 py-4" : "px-5 py-6 sm:px-7 sm:py-8", style.frame)}>
        <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r", style.bar)} />
        <div className={cn("pointer-events-none absolute rounded-full blur-3xl", compact ? "-left-20 top-6 h-48 w-48" : "-left-28 top-10 h-64 w-64", style.wash)} />
        <div className={cn("pointer-events-none absolute bottom-0 rounded-full bg-[#e5f0fb]/55 blur-3xl", compact ? "-right-20 h-52 w-52" : "-right-28 h-72 w-72")} />
        <div className="relative">
          <div className={cn("flex flex-wrap items-center justify-between", compact ? "gap-2" : "gap-3")}>
            <span className={cn("inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border font-black uppercase tracking-[0.16em]", compact ? "px-2.5 py-1 text-[9px]" : "px-3 py-1.5 text-[10px] sm:text-xs", style.badge)}>
              {style.label}
              <span className={cn("grid place-items-center rounded-[8px] rounded-br-[4px] border", compact ? "h-5 w-5" : "h-6 w-6", style.tile)}>
                <Swords size={compact ? 11 : 13} />
              </span>
            </span>
            <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border border-ink/10 bg-white/70 font-black uppercase tracking-[0.12em] text-muted", compact ? "gap-1.5 px-2 py-1 text-[9px]" : "gap-2 px-2.5 py-1.5 text-[10px] sm:text-xs")}>
              <Clock3 size={compact ? 13 : 15} className={style.clock} />
              {live ? "Ends tomorrow" : "Starts tomorrow"}
            </span>
          </div>

          <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", compact ? "mt-4" : "mt-6")}>
            <div>
              <div className="eyebrow text-coral">Choose your champion</div>
              <h2 className={cn("display mt-2 max-w-3xl font-black leading-[1.02] tracking-[-0.045em]", compact ? "text-3xl" : "text-3xl sm:text-5xl")}>{brawl.prompt}</h2>
            </div>
            <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border border-coral/20 bg-white/70 font-black uppercase tracking-[0.12em] text-muted", compact ? "gap-1.5 px-2 py-1 text-[10px]" : "gap-2 px-2.5 py-1.5 text-xs")}>
              <span className="h-2 w-2 rounded-full bg-coral" />
              Two products · one vote
            </span>
          </div>

          <div className={cn("relative grid items-center", compact ? "mt-4 gap-3" : "mt-7 gap-4", !compact && "lg:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)] lg:gap-6")}>
            <BrawlOption product={left} side="left" selected={choice === "left"} onClick={() => choose("left")} compact={compact} />
            <VersusBadge compact={compact} />
            <BrawlOption product={right} side="right" selected={choice === "right"} onClick={() => choose("right")} compact={compact} />
          </div>

          <div className={cn("rounded-[16px] rounded-br-[7px] border border-ink/10 bg-white/55", compact ? "mt-5 px-3 py-3" : "mt-7 px-4 py-4")}>
            <div className="flex items-end justify-between gap-5">
              <div>
                <span className={cn("display block font-black leading-none", compact ? "text-4xl" : "text-4xl sm:text-5xl", optionStyle("left").percent)}>{leftPercent}%</span>
                <span className={cn("block max-w-[180px] truncate text-xs font-black text-ink", compact ? "mt-1" : "mt-2")}>{left.name}</span>
              </div>
              <div className="pb-1 text-center">
                <span className="eyebrow text-muted">Live split</span>
                <span className="mt-1 block text-xs font-bold text-muted">{totalVotes.toLocaleString()} votes</span>
              </div>
              <div className="text-right">
                <span className={cn("display block font-black leading-none", compact ? "text-4xl" : "text-4xl sm:text-5xl", optionStyle("right").percent)}>{rightPercent}%</span>
                <span className={cn("block max-w-[180px] truncate text-xs font-black text-ink", compact ? "mt-1" : "mt-2")}>{right.name}</span>
              </div>
            </div>
            <div className={cn("relative overflow-hidden rounded-[10px] rounded-br-[4px] bg-[#eef0ee]", compact ? "mt-3 h-2.5" : "mt-4 h-3.5")}>
              <span className="absolute inset-y-0 left-0 rounded-[10px] rounded-br-[4px] transition-[width] duration-500" style={{ width: `${leftPercent}%`, backgroundColor: left.color }} />
              <span className="absolute inset-y-0 right-0 rounded-[10px] rounded-br-[4px] transition-[width] duration-500" style={{ width: `${rightPercent}%`, backgroundColor: right.color }} />
              <span className="absolute left-1/2 top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-[4px] rounded-br-[2px] border border-white bg-ink/55" />
            </div>
          </div>

          <div className={cn("flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center", compact ? "mt-4 gap-3" : "mt-5 gap-4")}>
            <div>
              <span className="inline-flex items-center gap-2 rounded-[12px] rounded-br-[5px] border border-ink/10 bg-white/70 px-2.5 py-1.5 text-xs font-bold text-muted">
                <Users size={15} className="text-[#5f5a91]" />
                {totalVotes.toLocaleString()} votes counted
              </span>
              {message ? <p className="mt-2 max-w-[260px] text-[11px] font-semibold text-muted" role="status">{message}</p> : null}
            </div>
            <Button
              type="button"
              onClick={() => setVoteModalOpen(true)}
              aria-haspopup="dialog"
              variant="primary"
              size={compact ? "sm" : "md"}
              arrow
              arrowIcon={cta.icon}
              className={cn("self-start", voted && "border-[#2d7667] bg-[#3e8e65] hover:bg-[#2d7667]")}
            >
              {cta.label}
            </Button>
            <ButtonLink href={`/brawl/${brawl.id}`} variant="secondary" size="sm" arrow className="justify-start sm:justify-self-end">View details</ButtonLink>
          </div>
        </div>
      </article>
      <BrawlVoteModal
        key={voteModalOpen ? "open" : "closed"}
        open={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        brawl={brawl}
        left={left}
        right={right}
        initialVoteChoice={choice}
        hasVoted={voted}
        hasPrediction={predictionSaved}
        onVoteCounted={(side) => {
          setVoteCounts((counts) => ({ ...counts, [side]: counts[side] + 1 }));
          setVoted(true);
          setMessage("Vote counted. +2 XP awarded once.");
        }}
        onPredictionSaved={() => setPredictionSaved(true)}
      />
    </>
  );
}

function BrawlOption({ product, side, selected, onClick, compact }: { product: Product; side: BrawlSide; selected: boolean; onClick: () => void; compact: boolean }) {
  const style = optionStyle(side);
  return (
    <div className="relative">
      <Button
        type="button"
        variant="choice"
        size="md"
        unstyled
        aria-pressed={selected}
        aria-label={`Vote for ${product.name}`}
        onClick={onClick}
        className={cn(
          "group relative flex w-full items-center rounded-[20px] rounded-br-[8px] border-2 text-left transition hover:-translate-y-0.5",
          compact ? "min-h-[104px] gap-3 px-3 py-3" : "min-h-[142px] gap-4 px-4 py-5 sm:min-h-[158px] sm:gap-5",
          !compact && "lg:min-h-[172px]",
          side === "left" && !compact && "lg:flex-row-reverse lg:text-right",
          style.frame,
          selected && style.selected,
        )}
      >
        <div className="relative shrink-0">
          <div className={cn("pointer-events-none absolute -inset-2 rounded-full border border-dashed opacity-80", style.ring)} />
          <ProductLogo product={product} size={compact ? "lg" : "xl"} className={cn("rounded-full border border-white shadow-none ring-1", style.logoRing)} />
          {side === "left" ? <Crown size={28} fill="#f4b52e" strokeWidth={1.7} className="pointer-events-none absolute -left-3 -top-4 rotate-[-16deg] text-[#d99012]" /> : null}
        </div>
        <span className="min-w-0 flex-1">
          <span className={cn("eyebrow", style.eyebrow)}>{style.label}</span>
          <span className={cn("mt-1 block truncate font-black tracking-[-0.04em] text-ink", compact ? "text-xl" : "text-2xl sm:text-3xl")}>{product.name}</span>
          <span className={cn("line-clamp-2 text-muted", compact ? "mt-1 text-xs leading-4" : "mt-2 text-sm leading-5")}>{product.shortDescription}</span>
        </span>
        {selected ? (
          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-[10px] rounded-br-[4px] border border-white/30 bg-coral text-white">
            <Check size={13} />
          </span>
        ) : null}
      </Button>
    </div>
  );
}

function VersusBadge({ compact }: { compact: boolean }) {
  return (
    <div className={cn("relative flex items-center justify-center", compact ? "h-20" : "h-28", !compact && "lg:h-40")}>
      <div className="pointer-events-none absolute inset-x-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#e2b041] to-transparent" />
      <Image src="/brawl-vs-emblem-v4.png" alt="VS" width={160} height={160} sizes="(min-width: 640px) 148px, 112px" unoptimized className={cn("relative object-contain", compact ? "h-20 w-20" : "h-[108px] w-[108px] sm:h-[138px] sm:w-[138px]")} />
    </div>
  );
}
