import { Eye, ShieldCheck, Sparkles } from "lucide-react";

const notes = [{ icon: Eye, title: "Paid means sponsored", text: "Sponsored placement is always labeled. Money never masquerades as organic ranking." }, { icon: ShieldCheck, title: "Outbid ≠ wasted", text: "Your purchased promotional allocation keeps delivering after your position changes." }, { icon: Sparkles, title: "Built for real launches", text: "Qualified impressions and clicks are tracked so you can learn what moved." }];

export function TrustNote({ variant = "default" }: { variant?: "default" | "rail" }) {
  if (variant === "rail") {
    return <div className="relative overflow-hidden border-y border-line bg-paper-strong/30 px-5 py-5 sm:px-7"><div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full border-[18px] border-[#eaf3fb]" /><div className="relative grid gap-5 sm:grid-cols-3 sm:gap-0">{notes.map((item, index) => <div key={item.title} className={`flex gap-3 sm:px-5 ${index > 0 ? "sm:border-l sm:border-line" : ""}`}><item.icon size={18} className="mt-0.5 shrink-0 text-coral" /><div><p className="text-sm font-bold text-ink">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted">{item.text}</p></div></div>)}</div></div>;
  }
  return <div className="grid gap-4 border border-line bg-paper-strong/60 p-5 sm:grid-cols-3 sm:p-6">{notes.map((item) => <div key={item.title} className="flex gap-3"><item.icon size={18} className="mt-0.5 shrink-0 text-coral" /><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted">{item.text}</p></div></div>)}</div>;
}
