"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3, Crown, Medal, Sparkles } from "lucide-react";
import type { LeaderboardRound, Product } from "@/lib/types";
import { cn, formatCompact, formatMoney } from "@/lib/utils";
import { CountdownTimer } from "@/components/leaderboard/CountdownTimer";
import { ProductLogo } from "@/components/products/ProductLogo";
import { Button, ButtonLink } from "@/components/ui/Button";

const AUTOPLAY_MS = 5500;

type PodiumRank = 1 | 2 | 3;

type FeaturedLeaderCarouselProps = {
  leaders: Product[];
  round: LeaderboardRound;
  categoryNames?: Record<string, string>;
};

function podiumRank(index: number): PodiumRank {
  if (index === 0) return 1;
  if (index === 1) return 2;
  return 3;
}

function podiumStyle(rank: PodiumRank) {
  switch (rank) {
    case 1:
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#f8f6f1_38%,#ffffff_100%)] shadow-[0_28px_80px_rgba(201,148,32,.28),0_10px_28px_rgba(20,33,43,.1)]",
        bar: "from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
        glowLeft: "border-[#f7d36d]/85",
        glowRight: "border-coral/20",
        wash: "bg-[#fff0b5]/55",
        eyebrow: "text-[#8d610f]",
        rank: "text-[#7f570b]",
        rankWash: "bg-[#f7d36d]/55",
        ring: "border-[#e9c96b]",
        logoRing: "ring-[#f7d26e]/80",
        badge: "border-[#f4c788] bg-[#fff4d6] text-[#c24b2a]",
        medal: "from-[#ffe8a8] to-[#e0ab39] text-[#7f570b]",
        stat: "text-[#a26d08]",
        label: "Featured sponsored leader",
        live: "Live leader",
      };
    case 2:
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(135deg,#eef6fc_0%,#f8f6f1_38%,#ffffff_100%)] shadow-[0_28px_80px_rgba(80,130,170,.22),0_10px_28px_rgba(20,33,43,.08)]",
        bar: "from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
        glowLeft: "border-[#c7dced]/90",
        glowRight: "border-[#9bbdd4]/35",
        wash: "bg-[#d9ecfb]/55",
        eyebrow: "text-[#355875]",
        rank: "text-[#355875]",
        rankWash: "bg-[#c7dced]/70",
        ring: "border-[#b9d2e6]",
        logoRing: "ring-[#d5e3ef]",
        badge: "border-[#c5d8e8] bg-[#eef6fc] text-[#355875]",
        medal: "from-[#f4f8fb] to-[#b7cfe0] text-[#355875]",
        stat: "text-[#40698c]",
        label: "Second on the board",
        live: "Chasing #1",
      };
    case 3:
      return {
        frame: "border-[#e2b189] bg-[linear-gradient(135deg,#fbeede_0%,#f8f6f1_38%,#ffffff_100%)] shadow-[0_28px_80px_rgba(176,110,58,.22),0_10px_28px_rgba(20,33,43,.08)]",
        bar: "from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
        glowLeft: "border-[#e5b17d]/85",
        glowRight: "border-[#dca371]/30",
        wash: "bg-[#f6dfca]/50",
        eyebrow: "text-[#9b5d2d]",
        rank: "text-[#9b5d2d]",
        rankWash: "bg-[#e5b17d]/50",
        ring: "border-[#e2b189]",
        logoRing: "ring-[#e1ae7b]/80",
        badge: "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]",
        medal: "from-[#f8e0c8] to-[#cd8550] text-[#7a4420]",
        stat: "text-[#a86636]",
        label: "Third on the board",
        live: "In the hunt",
      };
    default: {
      const _exhaustive: never = rank;
      return _exhaustive;
    }
  }
}

function RankMedal({ rank }: { rank: PodiumRank }) {
  const style = podiumStyle(rank);
  let icon: ReactNode;
  switch (rank) {
    case 1:
      icon = <Crown size={15} fill="currentColor" />;
      break;
    case 2:
    case 3:
      icon = <Medal size={15} />;
      break;
    default: {
      const _exhaustive: never = rank;
      return _exhaustive;
    }
  }

  return (
    <span className={cn("absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br shadow-[0_6px_14px_rgba(20,33,43,.18)]", style.medal)}>
      {icon}
    </span>
  );
}

function FeaturedLeaderSlide({
  leader,
  round,
  categoryName,
  rank,
}: {
  leader: Product;
  round: LeaderboardRound;
  categoryName?: string;
  rank: PodiumRank;
}) {
  const style = podiumStyle(rank);
  const position = String(rank).padStart(2, "0");

  return (
    <div className="animate-featured-slide relative grid gap-7 lg:grid-cols-[1.15fr_.55fr_.9fr] lg:items-center lg:gap-8">
      <div className="flex items-center gap-5 sm:gap-7">
        <div className="relative shrink-0">
          <div className={cn("absolute -inset-3 rounded-full border border-dashed opacity-80", style.ring)} />
          <div className={cn("absolute -inset-5 rounded-full border opacity-40", style.ring)} />
          <ProductLogo product={leader} size="xl" className={cn("relative border-4 border-white shadow-[0_16px_36px_rgba(20,33,43,.16)]", style.logoRing, "ring-2")} />
          <RankMedal rank={rank} />
        </div>
        <div className="min-w-0">
          <div className={cn("eyebrow flex items-center gap-2", style.eyebrow)}>
            <Sparkles size={13} /> {style.label}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h2 className="display text-3xl font-black tracking-[-0.045em] text-ink sm:text-4xl">
              <Link href={`/product/${leader.slug}`} className="transition hover:text-coral">
                {leader.name}
              </Link>
            </h2>
            <span className={cn("inline-flex items-center gap-1.5 rounded-[12px] rounded-br-[5px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]", style.badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", rank === 1 ? "animate-pulse-soft bg-coral" : "bg-current")} />
              {style.live}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-muted">
            {categoryName ?? "Independent launch"} · {leader.makerName}
          </p>
          <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-muted sm:text-base">{leader.shortDescription}</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center border-y border-line/80 py-5 lg:border-y-0 lg:border-x lg:py-3">
        <div className={cn("pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl", style.rankWash)} />
        <div className="relative text-center">
          <div className={cn("inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]", style.eyebrow)}>
            <Crown size={14} fill="currentColor" /> Current position
          </div>
          <div className={cn("display mt-1 text-6xl font-black leading-none tracking-[-0.08em] sm:text-7xl", style.rank)}>{position}</div>
          <p className="mt-2 text-xs text-muted">On today&apos;s board</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 lg:grid-cols-2">
        <div>
          <p className={cn("eyebrow", style.stat)}>Bid</p>
          <p className="display mt-1 text-3xl font-black text-ink">{formatMoney(leader.bidCents)}</p>
        </div>
        <div>
          <p className="eyebrow text-[#2c668e]">Reach</p>
          <p className="display mt-1 text-3xl font-black text-ink">{formatCompact(leader.totalQualifiedClicks)}</p>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Clock3 size={16} className="text-coral" />
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.15em]">Round ends</span>
            <CountdownTimer endsAt={round.endsAt} compact />
          </span>
        </div>
        <ButtonLink href="#daily-brawl" variant="primary" size="md" arrow className="self-center">
          Enter today&apos;s brawl
        </ButtonLink>
      </div>
    </div>
  );
}

export function FeaturedLeaderCarousel({ leaders, round, categoryNames }: FeaturedLeaderCarouselProps) {
  const carouselId = useId();
  const count = Math.min(leaders.length, 3);
  const slides = leaders.slice(0, 3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const canRotate = count > 1;
  const active = slides[index] ?? slides[0];
  const rank = podiumRank(index);
  const style = podiumStyle(rank);

  const goTo = useCallback(
    (next: number) => {
      if (count < 1) return;
      setIndex(((next % count) + count) % count);
      setCycle((value) => value + 1);
    },
    [count],
  );

  useEffect(() => {
    if (!canRotate || paused) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [canRotate, paused, count, cycle]);

  if (!active) return null;

  return (
    <div
      id={carouselId}
      role="region"
      aria-roledescription="carousel"
      aria-label="Top three sponsored leaders"
      className={cn("relative mx-auto mt-11 max-w-6xl overflow-hidden rounded-[32px] rounded-br-[14px] border-2 px-5 py-6 sm:px-8 sm:py-8 lg:px-10", style.frame)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
        setPaused(false);
      }}
      onKeyDown={(event) => {
        if (!canRotate) return;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(index + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(index - 1);
        }
      }}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", style.bar)} />
      <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r opacity-80", style.bar)} />
      <div className={cn("pointer-events-none absolute -left-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border-[28px]", style.glowLeft)} />
      <div className={cn("pointer-events-none absolute -right-32 -top-28 h-72 w-72 rounded-full border-[36px]", style.glowRight)} />
      <div className={cn("pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full blur-3xl", style.wash)} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-featured-shine absolute -inset-y-16 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>

      <div className="relative mb-5 inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14] sm:text-xs">
        Top 3 sponsored
        <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#4d3a14]/20 bg-[#4d3a14]/10">
          <Crown size={13} fill="currentColor" />
        </span>
      </div>

      <div className="relative" aria-live="polite" aria-atomic="true">
        <FeaturedLeaderSlide
          key={active.id}
          leader={active}
          round={round}
          categoryName={categoryNames?.[active.categoryId]}
          rank={rank}
        />
      </div>

      {canRotate ? (
        <div className="relative mt-6 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
          <div className="flex items-center gap-2" aria-label="Sponsored leader slides">
            {slides.map((leader, slideIndex) => {
              const slideRank = podiumRank(slideIndex);
              const selected = slideIndex === index;
              return (
                <button
                  key={leader.id}
                  type="button"
                  aria-current={selected ? "true" : undefined}
                  aria-label={`Show ${leader.name}, position ${slideRank}`}
                  aria-controls={carouselId}
                  onClick={() => goTo(slideIndex)}
                  className={cn(
                    "relative min-w-12 overflow-hidden rounded-[14px] rounded-br-[6px] border px-3 py-1.5 text-[11px] font-black tracking-[0.12em] transition",
                    selected ? cn(podiumStyle(slideRank).badge, "shadow-[0_8px_18px_rgba(20,33,43,.1)]") : "border-ink/20 bg-paper text-muted hover:border-ink hover:text-ink",
                  )}
                >
                  {String(slideRank).padStart(2, "0")}
                  {selected ? (
                    <span
                      key={cycle}
                      className="animate-featured-progress absolute inset-x-0 bottom-0 h-0.5 origin-left bg-current/70"
                      style={{ animationPlayState: paused ? "paused" : "running" }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="icon" className="rounded-br-[5px]" aria-label="Previous sponsored leader" onClick={() => goTo(index - 1)}>
              <ChevronLeft size={18} />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="rounded-br-[5px]" aria-label="Next sponsored leader" onClick={() => goTo(index + 1)}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
