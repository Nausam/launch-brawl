import { cn } from "@/lib/utils";

export function BrawlMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("relative inline-flex shrink-0 items-center justify-center rounded-[9px] bg-coral text-white shadow-[3px_3px_0_#14212b]", compact ? "h-7 w-7" : "h-9 w-9")} aria-hidden="true">
        <span className={cn("display font-black leading-none", compact ? "text-[14px]" : "text-[18px]")}>B</span>
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-paper bg-ink" />
      </span>
      <span className={cn("display font-black tracking-[-0.05em] text-ink", compact ? "text-[18px]" : "text-[22px]")}>Launch Brawl</span>
    </span>
  );
}
