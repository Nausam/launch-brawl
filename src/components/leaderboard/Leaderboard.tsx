import Link from "next/link";
import { ArrowDown, ArrowUp, Minus, MousePointer2, Trophy } from "lucide-react";
import type { LeaderboardRound, Product } from "@/lib/types";
import { formatCompact, formatMoney } from "@/lib/utils";
import { ProductLogo } from "@/components/products/ProductLogo";
import { Pill } from "@/components/ui/Pill";
import { BidDialog } from "@/components/leaderboard/BidDialog";
import { CountdownTimer } from "@/components/leaderboard/CountdownTimer";

function Movement({ product }: { product: Product }) {
  if (product.trend === "new") return <span className="font-bold text-coral">NEW</span>;
  if (product.trend === "up") return <span className="inline-flex items-center gap-0.5 font-bold text-[#3E8E65]"><ArrowUp size={12} />{product.previousPosition ? product.previousPosition - product.position : 1}</span>;
  if (product.trend === "down") return <span className="inline-flex items-center gap-0.5 font-bold text-coral-dark"><ArrowDown size={12} />1</span>;
  return <Minus size={13} className="text-muted" />;
}

export function Leaderboard({ products, round, compact = false }: { products: Product[]; round: LeaderboardRound; compact?: boolean }) {
  const visible = compact ? products.slice(0, 5) : products;
  return <div className="border-y border-line">
    <div className="hidden grid-cols-[52px_minmax(0,1fr)_100px_105px_132px] gap-4 border-b border-line bg-paper-strong/45 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted sm:grid"><span>Rank</span><span>Product</span><span>Bid</span><span>Reach</span><span /></div>
    {visible.map((product, index) => <div key={product.id} className={`grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-3 py-4 last:border-0 sm:grid-cols-[52px_minmax(0,1fr)_100px_105px_132px] sm:gap-4 sm:px-4 ${index === 0 ? "bg-coral/[0.035]" : "bg-paper"}`}>
      <div className="flex flex-col items-center gap-1"><span className={`display text-xl font-black ${index < 3 ? "text-ink" : "text-muted"}`}>{String(index + 1).padStart(2, "0")}</span><Movement product={product} /></div>
      <Link href={`/product/${product.slug}`} className="flex min-w-0 items-center gap-3 group"><ProductLogo product={product} size="sm" /><span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate font-bold text-ink transition group-hover:text-coral">{product.name}</span>{index === 0 && <span className="hidden sm:inline-flex"><Pill tone="coral">Live leader</Pill></span>}</span><span className="mt-0.5 block truncate text-xs text-muted">{product.shortDescription}</span></span></Link>
      <span className="justify-self-end text-sm font-bold text-ink sm:justify-self-start">{formatMoney(product.bidCents)}</span>
      <span className="hidden items-center gap-1 text-xs text-muted sm:inline-flex"><MousePointer2 size={13} />{formatCompact(product.totalQualifiedClicks)}</span>
      <div className="hidden justify-end sm:flex"><BidDialog productId={product.id} productName={product.name} currentBidCents={product.bidCents} roundId={round.id} buttonLabel={index === 0 ? "Defend #1" : "Take the lead"} /></div>
    </div>)}
    <div className="flex flex-col gap-3 bg-paper-strong/45 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="inline-flex items-center gap-2 font-semibold text-muted"><span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" />Live leaderboard · resets at midnight UTC</span><span className="inline-flex items-center gap-2 text-muted">Round ends in <CountdownTimer endsAt={round.endsAt} compact /></span></div>
  </div>;
}

export function Podium({ products }: { products: Product[] }) {
  const top = products.slice(0, 3);
  return <div className="grid items-end gap-3 sm:grid-cols-3 sm:gap-4">{[top[1], top[0], top[2]].map((product, index) => product && <div key={product.id} className={`relative flex flex-col items-center border border-line p-5 text-center ${index === 1 ? "bg-coral text-white sm:-mt-4 sm:pb-8" : "bg-paper"}`}><span className={`eyebrow ${index === 1 ? "text-white/75" : "text-coral"}`}>#{index === 1 ? 1 : index === 0 ? 2 : 3}</span><ProductLogo product={product} size={index === 1 ? "xl" : "lg"} className="mt-4 border-4 border-paper" /><h3 className="display mt-4 text-2xl font-black">{product.name}</h3><p className={`mt-1 text-xs ${index === 1 ? "text-white/75" : "text-muted"}`}>{product.makerName}</p><span className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${index === 1 ? "text-white" : "text-ink"}`}><Trophy size={14} />{formatMoney(product.bidCents)}</span></div>)}</div>;
}
