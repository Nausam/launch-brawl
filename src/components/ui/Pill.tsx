import { cn } from "@/lib/utils";

export function Pill({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "coral" | "mint" | "blue" | "butter"; className?: string }) {
  const tones = { neutral: "bg-paper-strong text-muted", coral: "bg-coral/10 text-coral-dark", mint: "bg-mint text-[#2d7667]", blue: "bg-sky text-[#35608b]", butter: "bg-butter text-[#876d27]" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone], className)}>{children}</span>;
}
