import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, detail, tone = "neutral", className }: { label: string; value: string; detail?: string; tone?: "neutral" | "coral" | "mint" | "blue"; className?: string }) {
  const tones = { neutral: "bg-paper", coral: "bg-coral text-white", mint: "bg-mint", blue: "bg-sky" };
  return <div className={cn("border border-line p-5", tones[tone], className)}><div className={cn("eyebrow flex items-center justify-between", tone === "coral" ? "text-white/75" : "text-muted")}><span>{label}</span><TrendingUp size={14} /></div><div className="display mt-4 text-3xl font-black">{value}</div>{detail && <div className={cn("mt-2 text-xs", tone === "coral" ? "text-white/75" : "text-muted")}>{detail}</div>}</div>;
}
