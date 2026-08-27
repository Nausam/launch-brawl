import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type RankTone = "gold" | "silver" | "bronze" | "rest";
export type DeskKind = "owner" | "admin";
export type DeskStatTone = "coral" | "gold" | "blue" | "mint";

export function rankStyle(tone: RankTone) {
  switch (tone) {
    case "gold":
      return {
        frame: "border-[#e4c15a] bg-[linear-gradient(135deg,#fff8df_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(201,148,32,.16)]",
        rail: "from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
        wash: "bg-[#fff0b5]/45",
        medal: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]",
        badge: "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]",
        heat: "from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
      };
    case "silver":
      return {
        frame: "border-[#b7cfe0] bg-[linear-gradient(135deg,#eef6fc_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(80,130,170,.14)]",
        rail: "from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
        wash: "bg-[#d9ecfb]/45",
        medal: "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]",
        badge: "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]",
        heat: "from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
      };
    case "bronze":
      return {
        frame: "border-[#e2b189] bg-[linear-gradient(135deg,#fbeede_0%,#f8f6f1_48%,#ffffff_100%)] shadow-[0_16px_40px_rgba(176,110,58,.14)]",
        rail: "from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
        wash: "bg-[#f6dfca]/45",
        medal: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf6,#f8e0c8,#e2b189)] text-[#9b5d2d]",
        badge: "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]",
        heat: "from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
      };
    case "rest":
      return {
        frame: "border-[#d6e3ef] bg-white/80 shadow-[0_10px_24px_rgba(20,33,43,.06)]",
        rail: "from-[#e8eef4] via-[#c9d7e4] to-[#9bbdd4]",
        wash: "bg-[#eef4fa]/50",
        medal: "border-[#c9d7e4] bg-[linear-gradient(180deg,#ffffff,#eef4fa,#d6e3ef)] text-ink",
        badge: "border-line bg-paper text-muted",
        heat: "from-[#e8eef4] via-[#c9d7e4] to-[#9bbdd4]",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export function deskStatStyle(tone: DeskStatTone) {
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

export function DeskStat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string; label: string; tone: DeskStatTone }) {
  const style = deskStatStyle(tone);
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

export function deskEyebrow(kind: DeskKind) {
  switch (kind) {
    case "owner":
      return "border-coral/30 bg-coral/10 text-coral";
    case "admin":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function DeskHeader({
  kind,
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
}: {
  kind: DeskKind;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <section className="noise relative border-b border-line pb-3">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className={cn("absolute -left-[18%] -top-36 h-[340px] w-[110%] rounded-[50%] border-[14px]", kind === "admin" ? "border-[#d6e3ef]" : "border-[#eef3f8]")} />
        <div className={cn("absolute right-[-1.5rem] top-4 h-40 w-40 rounded-full border-[22px]", kind === "admin" ? "border-[#b7cfe0]/40" : "border-coral/10")} />
      </div>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className={cn("inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] sm:text-xs", deskEyebrow(kind))}>
            {eyebrow}
            {Icon ? (
              <span className={cn("grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border", kind === "admin" ? "border-[#b7cfe0] bg-white" : "border-white/30 bg-coral text-white")}>
                <Icon size={13} />
              </span>
            ) : null}
          </div>
          <h1 className="display mt-4 max-w-3xl text-4xl font-black leading-[.95] tracking-[-0.05em] text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">{description}</p>
        </div>
        {action ? <div className="self-start">{action}</div> : null}
      </div>
    </section>
  );
}

export function DeskPlaque({ tone, children, className }: { tone: RankTone; children: ReactNode; className?: string }) {
  const style = rankStyle(tone);
  return (
    <article className={cn("relative overflow-hidden rounded-[24px] rounded-br-[10px] border-2 px-4 py-4 sm:px-5", style.frame, className)}>
      <div className="relative">{children}</div>
    </article>
  );
}

export function DeskEmpty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper-strong/45 px-6 py-10 text-center">
      <p className="text-sm font-black text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function padTicket(index: number) {
  return String(index + 1).padStart(2, "0");
}
