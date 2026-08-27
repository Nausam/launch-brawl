import Link from "next/link";
import { Compass, Flame, Link2, Package, Radio, Sparkles, Target, Trophy, UserRound, type LucideIcon } from "lucide-react";
import type { ActivityEvent, AchievementRarity, AppUser, EarnedAchievement, Product, UserGamification } from "@/lib/types";
import { cn, formatCompact, initials, isValidOutboundUrl, relativeTime } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SubmitProductButton } from "@/components/submit/SubmitProductButton";
import { ButtonLink } from "@/components/ui/Button";

type ProfileStatTone = "coral" | "gold" | "blue" | "mint";
type ActivityKind = "win" | "draw" | "streak" | "prediction" | "bounty" | "other";
type KnownActivityType = "BRAWL_WIN" | "BRAWL_DRAW" | "WIN_STREAK" | "PREDICTION_STREAK" | "BOUNTY_COMPLETED";

const jumps = [
  { key: "launches", label: "Launches" },
  { key: "record", label: "Record" },
  { key: "activity", label: "Activity" },
] as const;

export function MakerProfile({
  user,
  products,
  activity,
  stats,
  achievements,
}: {
  user: AppUser;
  products: Product[];
  activity: ActivityEvent[];
  stats: UserGamification;
  achievements: EarnedAchievement[];
}) {
  const votes = products.reduce((sum, product) => sum + (product.organicVotes ?? product.totalVotes), 0);
  const websiteHref = user.website && isValidOutboundUrl(user.website) ? user.website : undefined;
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <>
      <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -left-[28%] -top-52 h-[500px] w-[156%] rounded-[50%] border-[18px] border-[#eef3f8]" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full border-[32px] border-coral/10" />
        <PageContainer className="relative pt-14 pb-3 lg:pt-20 lg:pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
                  Maker exhibit
                  <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                    <UserRound size={13} />
                  </span>
                </div>
                <span className="inline-flex items-center rounded-[12px] rounded-br-[5px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#4d3a14]">
                  Level {stats.level} · {stats.levelTitle}
                </span>
                {stats.tastemakerScore > 0 ? (
                  <span className="inline-flex items-center rounded-[12px] rounded-br-[5px] border border-[#b7cfe0] bg-[#eef6fc] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#355875]">
                    Tastemaker
                  </span>
                ) : null}
              </div>
              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                <MakerMark user={user} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">@{user.username}</p>
                  <h1 className="display mt-2 max-w-3xl text-4xl font-black leading-[.95] tracking-[-0.05em] text-ink sm:text-6xl lg:text-7xl">{user.displayName}</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">{user.bio || "This maker has not added a public bio yet."}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start">
              {websiteHref ? (
                <ButtonLink href={websiteHref} variant="dark" size="md" arrow target="_blank" rel="noreferrer">
                  Visit site
                </ButtonLink>
              ) : null}
              <SubmitProductButton variant="primary" size="md" arrow icon={<Package size={16} />}>
                Add a product
              </SubmitProductButton>
            </div>
          </div>

          {websiteHref ? (
            <a
              href={websiteHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-xs font-black text-muted shadow-[2px_2px_0_#e5e2da] transition hover:border-ink hover:text-ink"
            >
              <span className="grid h-7 w-7 place-items-center rounded-[9px] rounded-br-[4px] border border-line bg-paper-strong text-coral">
                <Link2 size={13} />
              </span>
              {websiteHost(websiteHref)}
            </a>
          ) : null}

          <div className="relative mt-7 flex flex-wrap gap-3">
            <ProfileStat icon={Package} value={String(products.length)} label="Published launches" tone="coral" />
            <ProfileStat icon={Sparkles} value={formatCompact(votes)} label="Community votes" tone="gold" />
            <ProfileStat icon={Compass} value={formatCompact(stats.tastemakerScore)} label="Tastemaker score" tone="blue" />
            <ProfileStat icon={Flame} value={String(stats.currentPredictionStreak)} label="Prediction streak" tone="mint" />
          </div>

          <div className="relative mt-7 flex items-center gap-3">
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
        </PageContainer>
      </section>

      <section className="relative overflow-hidden pt-5 pb-14 lg:pt-6 lg:pb-16">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#e6f1fb]/55 blur-3xl" />
        <PageContainer className="relative py-0 lg:py-0">
          <section id="launches" className="scroll-mt-24">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
                  On the board
                  <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                    <Package size={13} />
                  </span>
                </div>
                <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink sm:text-4xl">Published launches.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Live listings attached to this account. Competitive history is calculated from published products and finalized Brawls.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted shadow-[2px_2px_0_#e5e2da]">
                {products.length} {products.length === 1 ? "launch" : "launches"}
              </span>
            </div>
            <div className="mt-6">
              {products.length ? (
                <ProductGrid products={products} />
              ) : (
                <EmptyCard
                  title="No published launches yet."
                  copy="This maker has not put a product on the public board. You can submit your own listing from here."
                />
              )}
            </div>
          </section>

          <section id="record" className="mt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
              Community identity
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#4d3a14]/20 bg-[#4d3a14]/10">
                <Trophy size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink sm:text-4xl">The public record.</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,.85fr)]">
              <article className="relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 border-ink bg-ink px-5 py-6 text-white sm:px-6">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[22px] border-white/10" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Level {stats.level}</p>
                <h3 className="display mt-2 text-3xl font-black tracking-[-0.04em]">{stats.levelTitle}</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/65">XP, early finds, and prediction accuracy stay on this profile. Paid board position is not part of the tastemaker score.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <RecordMetric label="XP" value={stats.xp.toLocaleString()} />
                  <RecordMetric label="Accuracy" value={`${stats.predictionAccuracy}%`} />
                  <RecordMetric label="Early finds" value={String(stats.earlyFinds)} />
                  <RecordMetric label="Best streak" value={String(stats.bestPredictionStreak)} />
                </div>
                <ButtonLink href="/tastemakers" variant="primary" size="sm" arrow className="mt-6">
                  Open tastemakers
                </ButtonLink>
              </article>
              <div className="grid gap-3">
                <CabinetCard
                  icon={Target}
                  title="Predictions"
                  copy={`${stats.correctPredictions} correct of ${stats.totalPredictions} public calls.`}
                />
                <CabinetCard
                  icon={Sparkles}
                  title="Quests"
                  copy={`${stats.questsCompleted} daily quests completed.`}
                />
                <div className="rounded-[17px] rounded-br-[8px] border border-line bg-white p-4 shadow-[2px_2px_0_#e5e2da] sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Trophy cabinet</p>
                  {achievements.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {achievements.slice(0, 8).map((achievement) => (
                        <span key={achievement.id} title={achievement.description} className={cn("rounded-[12px] rounded-br-[5px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]", rarityClass(achievement.rarity))}>
                          {achievement.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-muted">No public trophies earned yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section id="activity" className="mt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875] sm:text-xs">
              Public tape
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-[#b7cfe0] bg-white text-[#355875]">
                <Radio size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-3xl font-black tracking-[-0.05em] text-ink sm:text-4xl">What this account has done.</h2>
            <div className="mt-6 grid gap-3">
              {activity.length ? activity.slice(0, 10).map((event) => (
                <ActivityRow key={event.id} event={event} product={event.productId ? productsById.get(event.productId) : undefined} />
              )) : (
                <EmptyCard title="No public activity yet." copy="Votes, brawls, and predictions show up here once they happen in public." />
              )}
            </div>
          </section>
        </PageContainer>
      </section>
    </>
  );
}

function MakerMark({ user }: { user: AppUser }) {
  return (
    <div className="relative shrink-0">
      <div className="pointer-events-none absolute -inset-2 rounded-[28px] rounded-br-[12px] border border-dashed border-[#e4c15a]/70" />
      {user.imageUrl?.trim() ? (
        <img src={user.imageUrl} alt={user.displayName} className="h-20 w-20 rounded-[22px] rounded-br-[10px] border-2 border-white object-cover ring-1 ring-[#f7d26e]/80" />
      ) : (
        <span className="grid h-20 w-20 place-items-center rounded-[22px] rounded-br-[10px] border-2 border-white bg-coral text-2xl font-black text-white ring-1 ring-[#f7d26e]/80" aria-hidden>
          {initials(user.displayName)}
        </span>
      )}
    </div>
  );
}

function profileStatStyle(tone: ProfileStatTone) {
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
    case "mint":
      return {
        frame: "border-[#2f6f50] bg-[#e8f6ee] text-[#245c42] shadow-[0_12px_28px_rgba(62,142,101,.16)]",
        value: "text-[#245c42]",
        label: "text-[#3E8E65]",
        tile: "border-[#3E8E65]/25 bg-white/70 text-[#3E8E65]",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function ProfileStat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string; label: string; tone: ProfileStatTone }) {
  const style = profileStatStyle(tone);
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

function RecordMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] rounded-br-[7px] border border-white/15 bg-white/10 px-4 py-3">
      <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{label}</span>
      <span className="mt-1 block text-lg font-black">{value}</span>
    </div>
  );
}

function CabinetCard({ icon: Icon, title, copy }: { icon: LucideIcon; title: string; copy: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[17px] rounded-br-[8px] border border-line bg-white p-4 shadow-[2px_2px_0_#e5e2da]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">{copy}</p>
      </div>
    </div>
  );
}

function EmptyCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
      <div className="eyebrow text-coral">Quiet floor</div>
      <p className="mt-3 text-lg font-bold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{copy}</p>
    </div>
  );
}

function ActivityRow({ event, product }: { event: ActivityEvent; product?: Product }) {
  const kind = kindForType(event.type);
  const meta = kindMeta(kind);
  const Icon = meta.icon;
  const href = eventHref(event, product);
  const style = kindStyle(kind);
  const body = (
    <>
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border", style.tile)}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">{meta.label}</p>
        <p className="mt-1 truncate text-sm font-black text-ink">{eventTitle(event)}</p>
        <p className="mt-1 text-xs text-muted">{relativeTime(event.createdAt)}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("flex items-center gap-3 rounded-[17px] rounded-br-[8px] border bg-white px-4 py-3 shadow-[2px_2px_0_#e5e2da] transition hover:-translate-y-0.5", style.frame)}>
        {body}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-[17px] rounded-br-[8px] border bg-white px-4 py-3 shadow-[2px_2px_0_#e5e2da]", style.frame)}>
      {body}
    </div>
  );
}

function isKnownActivityType(type: string): type is KnownActivityType {
  switch (type) {
    case "BRAWL_WIN":
    case "BRAWL_DRAW":
    case "WIN_STREAK":
    case "PREDICTION_STREAK":
    case "BOUNTY_COMPLETED":
      return true;
    default:
      return false;
  }
}

function kindForType(type: string): ActivityKind {
  if (!isKnownActivityType(type)) return "other";
  switch (type) {
    case "BRAWL_WIN":
      return "win";
    case "BRAWL_DRAW":
      return "draw";
    case "WIN_STREAK":
      return "streak";
    case "PREDICTION_STREAK":
      return "prediction";
    case "BOUNTY_COMPLETED":
      return "bounty";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function kindMeta(kind: ActivityKind): { label: string; icon: LucideIcon } {
  switch (kind) {
    case "win":
      return { label: "Brawl win", icon: Trophy };
    case "draw":
      return { label: "Brawl draw", icon: Sparkles };
    case "streak":
      return { label: "Win streak", icon: Flame };
    case "prediction":
      return { label: "Prediction", icon: Target };
    case "bounty":
      return { label: "Bounty", icon: Sparkles };
    case "other":
      return { label: "Public signal", icon: Radio };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function kindStyle(kind: ActivityKind) {
  switch (kind) {
    case "win":
      return { frame: "border-[#e4c15a]", tile: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]" };
    case "draw":
      return { frame: "border-line", tile: "border-line bg-paper-strong text-muted" };
    case "streak":
      return { frame: "border-coral/30", tile: "border-coral/30 bg-coral/10 text-coral" };
    case "prediction":
      return { frame: "border-[#b7cfe0]", tile: "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]" };
    case "bounty":
      return { frame: "border-[#7c5cdb]/30", tile: "border-[#7c5cdb]/30 bg-[#7c5cdb]/10 text-[#5f48b6]" };
    case "other":
      return { frame: "border-line", tile: "border-line bg-paper-strong text-ink" };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function eventTitle(event: ActivityEvent) {
  const label = event.metadata.label;
  if (typeof label === "string" && label.trim()) return label;
  return event.type.replaceAll("_", " ").toLowerCase();
}

function eventHref(event: ActivityEvent, product?: Product) {
  if (product) return `/product/${product.slug}`;
  switch (event.entityType) {
    case "BRAWL":
      return `/brawl/${event.entityId}`;
    case "PRODUCT":
      return undefined;
    case "USER":
      return undefined;
    case "SEASON":
      return `/seasons/${event.entityId}`;
    case "LEAGUE":
      return `/league/${event.entityId}`;
    default: {
      const _exhaustive: never = event.entityType;
      return _exhaustive;
    }
  }
}

function rarityClass(rarity: AchievementRarity) {
  switch (rarity) {
    case "COMMON":
      return "border-line bg-paper text-muted";
    case "UNCOMMON":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    case "RARE":
      return "border-[#7c5cdb]/35 bg-[#7c5cdb]/10 text-[#5f48b6]";
    case "EPIC":
      return "border-coral/30 bg-coral/10 text-coral";
    case "LEGENDARY":
      return "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]";
    default: {
      const _exhaustive: never = rarity;
      return _exhaustive;
    }
  }
}

function websiteHost(value: string) {
  try {
    return new URL(value).host.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "");
  }
}
