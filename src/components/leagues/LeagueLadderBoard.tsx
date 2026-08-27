import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Crown, Flame, Minus, Trophy } from "lucide-react";
import type { Category, LeagueDivision, LeagueStanding, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductLogo } from "@/components/products/ProductLogo";
import { ButtonLink } from "@/components/ui/Button";

const previewLimit = 5;

type RankTone = "gold" | "silver" | "bronze" | "rest";
type MovementKind = "up" | "down" | "held";

export type LeagueLadder = {
  category: Category;
  standings: LeagueStanding[];
};

function rankTone(rank: number): RankTone {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "rest";
}

function rankStyle(tone: RankTone) {
  switch (tone) {
    case "gold":
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(201,148,32,.16)]",
        rail: "from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
        wash: "bg-[#fff0b5]/45",
        medal: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]",
        rank: "text-[#7f570b]",
        ring: "border-[#e9c96b]",
        logoRing: "ring-[#f7d26e]/80",
      };
    case "silver":
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(135deg,#eef6fc_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(80,130,170,.14)]",
        rail: "from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
        wash: "bg-[#d9ecfb]/45",
        medal: "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]",
        rank: "text-[#355875]",
        ring: "border-[#b9d2e6]",
        logoRing: "ring-[#d5e3ef]",
      };
    case "bronze":
      return {
        frame: "border-[#e2b189] bg-[linear-gradient(135deg,#fbeede_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(176,110,58,.14)]",
        rail: "from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
        wash: "bg-[#f6dfca]/45",
        medal: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf6,#f8e0c8,#e2b189)] text-[#9b5d2d]",
        rank: "text-[#9b5d2d]",
        ring: "border-[#e2b189]",
        logoRing: "ring-[#e1ae7b]/80",
      };
    case "rest":
      return {
        frame: "border-[#d6e3ef] bg-white/80 shadow-[0_10px_24px_rgba(20,33,43,.06)]",
        rail: "from-[#e8eef4] via-[#c9d7e4] to-[#9bbdd4]",
        wash: "bg-[#eef4fa]/50",
        medal: "border-[#c9d7e4] bg-[linear-gradient(180deg,#ffffff,#eef4fa,#d6e3ef)] text-ink",
        rank: "text-ink",
        ring: "border-[#c9d7e4]",
        logoRing: "ring-[#d5e3ef]",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function divisionStyle(division: LeagueDivision) {
  switch (division) {
    case "DIAMOND":
      return "border-ink bg-ink text-white";
    case "GOLD":
      return "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]";
    case "SILVER":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    case "BRONZE":
      return "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]";
    default: {
      const _exhaustive: never = division;
      return _exhaustive;
    }
  }
}

function divisionLabel(division: LeagueDivision) {
  switch (division) {
    case "DIAMOND":
      return "Diamond";
    case "GOLD":
      return "Gold";
    case "SILVER":
      return "Silver";
    case "BRONZE":
      return "Bronze";
    default: {
      const _exhaustive: never = division;
      return _exhaustive;
    }
  }
}

function movementKind(movement: number): MovementKind {
  if (movement > 0) return "up";
  if (movement < 0) return "down";
  return "held";
}

function movementCopy(kind: MovementKind, movement: number) {
  switch (kind) {
    case "up":
      return { label: `Up ${movement}`, className: "text-coral" };
    case "down":
      return { label: `Down ${Math.abs(movement)}`, className: "text-[#9b5d2d]" };
    case "held":
      return { label: "Held", className: "text-muted" };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function MovementIcon({ kind }: { kind: MovementKind }) {
  switch (kind) {
    case "up":
      return <ArrowUpRight size={13} />;
    case "down":
      return <ArrowDownRight size={13} />;
    case "held":
      return <Minus size={13} />;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function StandingRow({
  standing,
  product,
}: {
  standing: LeagueStanding;
  product: Product;
}) {
  const tone = rankTone(standing.rank);
  const style = rankStyle(tone);
  const kind = movementKind(standing.movement);
  const move = movementCopy(kind, standing.movement);
  const leader = standing.rank === 1;

  return (
    <article className={cn("group relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 px-4 py-4 sm:px-5 sm:py-5", style.frame)}>
      <div className={cn("pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b", style.rail)} />
      <div className={cn("pointer-events-none absolute -left-16 top-1/2 h-36 w-52 -translate-y-1/2 rounded-full blur-3xl", style.wash)} />
      <div className="relative grid gap-5 pl-2 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-14 w-14 place-items-center rounded-full border-2 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]", style.medal)}>
            <span className={cn("display text-xl font-black leading-none tracking-[-0.08em]", style.rank)}>{String(standing.rank).padStart(2, "0")}</span>
          </span>
          {leader ? (
            <span className="inline-flex items-center gap-1 rounded-[12px] rounded-br-[5px] border border-ink bg-ink px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
              <Crown size={12} className="text-coral" />
              Leader
            </span>
          ) : (
            <span className={cn("inline-flex items-center gap-1 rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", divisionStyle(standing.division))}>
              {divisionLabel(standing.division)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-start gap-4">
          <Link href={`/product/${product.slug}`} className="relative shrink-0">
            <div className={cn("pointer-events-none absolute -inset-2 rounded-[22px] border border-dashed opacity-70", style.ring)} />
            <ProductLogo product={product} size="lg" className={cn("border-2 border-white shadow-none ring-1", style.logoRing)} />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/product/${product.slug}`} className="display text-xl font-black tracking-[-0.03em] text-ink transition group-hover:text-coral">
                {product.name}
              </Link>
              {product.verified ? (
                <span className="grid h-5 w-5 place-items-center rounded-[8px] rounded-br-[3px] bg-navy text-white" aria-label="Verified product">
                  <Check size={12} />
                </span>
              ) : null}
              {standing.provisional ? (
                <span className="rounded-[12px] rounded-br-[5px] border border-line bg-paper px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted">Provisional</span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{product.shortDescription}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted">
              {leader ? (
                <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", divisionStyle(standing.division))}>
                  {divisionLabel(standing.division)}
                </span>
              ) : (
                <span>{standing.points} pts</span>
              )}
              <span className="h-1 w-1 rounded-full bg-line" />
              <span>by {product.makerName}</span>
              {standing.streak > 0 ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-line" />
                  <span className="inline-flex items-center gap-1 text-coral">
                    <Flame size={12} />
                    {standing.streak} streak
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          <div className="grid grid-cols-3 gap-2 sm:min-w-[280px]">
            <Scorecell label="Record" value={`${standing.wins}-${standing.losses}-${standing.draws}`} />
            <Scorecell label="Rating" value={String(standing.ratingCurrent)} />
            <Scorecell
              label="Move"
              value={move.label}
              icon={<MovementIcon kind={kind} />}
              className={move.className}
            />
          </div>
          <ButtonLink href={`/product/${product.slug}`} variant="secondary" size="sm" arrow>
            View launch
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

function Scorecell({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-[12px] rounded-br-[5px] border border-ink/10 bg-white/70 px-2.5 py-2 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={cn("mt-1 inline-flex items-center justify-center gap-1 text-sm font-black text-ink", className)}>
        {icon}
        {value}
      </p>
    </div>
  );
}

function DivisionKey() {
  const divisions: LeagueDivision[] = ["DIAMOND", "GOLD", "SILVER", "BRONZE"];
  return (
    <div className="flex flex-wrap gap-2">
      {divisions.map((division) => (
        <span key={division} className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", divisionStyle(division))}>
          {divisionLabel(division)}
        </span>
      ))}
    </div>
  );
}

function CategoryLadder({ ladder, products }: { ladder: LeagueLadder; products: Map<string, Product> }) {
  const preview = ladder.standings.slice(0, previewLimit);
  const remainder = Math.max(0, ladder.standings.length - preview.length);

  return (
    <section id={ladder.category.slug} className="scroll-mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-ink">
            {ladder.category.name} league
            <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] text-sm text-white" style={{ backgroundColor: ladder.category.accent }}>
              {ladder.category.icon}
            </span>
          </div>
          <p className="mt-2 max-w-xl text-xs leading-5 text-muted">{ladder.category.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-muted">
            {ladder.standings.length} {ladder.standings.length === 1 ? "product" : "products"}
          </span>
          <ButtonLink href={`/league/${ladder.category.slug}`} variant="secondary" size="sm" arrow>
            Open ladder
          </ButtonLink>
        </div>
      </div>

      {preview.length ? (
        <div className="mt-4 grid gap-3">
          {preview.map((standing) => {
            const product = products.get(standing.productId);
            return product ? <StandingRow key={standing.id} standing={standing} product={product} /> : null;
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-8 text-center">
          <p className="text-sm font-bold text-ink">No products have earned a place yet.</p>
          <p className="mt-1 text-xs text-muted">Completed Brawls in this category will write the first standings.</p>
        </div>
      )}

      {remainder > 0 ? (
        <div className="mt-3 flex justify-end">
          <Link href={`/league/${ladder.category.slug}`} className="text-xs font-black uppercase tracking-[0.14em] text-coral hover:text-coral-dark">
            {remainder} more on this ladder
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export function LeagueLadderBoard({ ladders, products }: { ladders: LeagueLadder[]; products: Product[] }) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const filled = ladders.filter((ladder) => ladder.standings.length);
  const waiting = ladders.filter((ladder) => !ladder.standings.length);
  const climbing = filled.reduce((sum, ladder) => sum + ladder.standings.length, 0);

  return (
    <section className="relative overflow-hidden pt-5 pb-14 lg:pt-6 lg:pb-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-16 h-80 w-80 rounded-full bg-[#e6f1fb]/55 blur-3xl" />
      <PageContainer className="relative py-0 lg:py-0">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              The ladders
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <Trophy size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">Rank is earned in the arena.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Each category is its own table. Bronze through Diamond, promotion at rollover, and a boss at the top — all from organic Brawl results.</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-xs font-bold text-muted sm:self-end">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" />
            {climbing} {climbing === 1 ? "product on the ladders" : "products on the ladders"}
          </span>
        </div>

        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Division key</p>
          <DivisionKey />
        </div>

        {filled.length ? (
          <div className="relative mt-8 grid gap-10">
            {filled.map((ladder) => (
              <CategoryLadder key={ladder.category.id} ladder={ladder} products={productMap} />
            ))}
          </div>
        ) : (
          <div className="relative mt-8 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
            <div className="eyebrow text-coral">The ladders are waiting</div>
            <p className="mt-3 text-lg font-bold text-ink">{ladders.length ? "No products have earned a place yet." : "Leagues appear after the first season is initialized."}</p>
            <p className="mt-2 text-sm text-muted">{ladders.length ? "Completed Brawls write the first standings in each category." : "An administrator can open a season, then completed Brawls will write the tables."}</p>
          </div>
        )}

        {waiting.length ? (
          <div id="waiting" className="relative mt-10 scroll-mt-24">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              Ladders still forming
            </div>
            <p className="mt-2 text-xs text-muted">These categories are open. The first completed Brawl writes the table.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {waiting.map((ladder) => (
                <Link
                  key={ladder.category.id}
                  href={`/league/${ladder.category.slug}`}
                  className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-xs font-black text-ink transition hover:border-ink"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] text-[11px] text-white" style={{ backgroundColor: ladder.category.accent }}>
                    {ladder.category.icon}
                  </span>
                  {ladder.category.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5 text-xs text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-coral" />Paid reach never buys a division or a boss reign.</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d8a52b]" />Promotion and relegation settle at season rollover.</span>
        </div>
      </PageContainer>
    </section>
  );
}
