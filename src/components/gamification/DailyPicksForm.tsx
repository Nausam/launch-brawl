"use client";

import { useState } from "react";
import { Check, LockKeyhole, Sparkles } from "lucide-react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function DailyPicksForm({ products, initialPicks }: { products: Product[]; initialPicks: string[] }) {
  const [selected, setSelected] = useState<string[]>(initialPicks);
  const [saved, setSaved] = useState(Boolean(initialPicks.length));
  const [message, setMessage] = useState<string | null>(initialPicks.length ? "Today's picks are already on your scorecard." : null);
  const [busy, setBusy] = useState(false);
  const toggle = (id: string) => { if (saved) return; setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current); };
  const submit = async () => {
    if (selected.length !== 3 || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/picks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds: selected }) });
      const result = await response.json() as { ok?: boolean; message?: string; error?: string };
      setMessage(result.message ?? result.error ?? "Picks updated.");
      if (response.ok && result.ok) setSaved(true);
    } catch { setMessage("The picks service is unavailable. Try again."); } finally { setBusy(false); }
  };
  return <div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => { const active = selected.includes(product.id); return <Button key={product.id} type="button" onClick={() => toggle(product.id)} aria-pressed={active} unstyled className={`flex items-center gap-3 border p-4 text-left transition ${active ? "border-coral bg-coral/5" : "border-line bg-paper hover:border-ink/25"} ${saved ? "cursor-default" : ""}`}><span className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-black ${active ? "border-coral bg-coral text-white" : "border-line text-transparent"}`}><Check size={14} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{product.name}</span><span className="mt-1 block truncate text-xs text-muted">{product.shortDescription}</span></span></Button>; })}</div><div className="mt-5 flex flex-wrap items-center gap-3"><Button type="button" onClick={submit} disabled={selected.length !== 3 || busy || saved} variant="dark" size="md">{saved ? "PICKS LOCKED" : busy ? "SAVING…" : "Lock today's picks"}<LockKeyhole size={14} /></Button><span className="inline-flex items-center gap-2 text-xs font-bold text-muted"><Sparkles size={14} className="text-coral" />{selected.length} / 3 selected · no money, no wagering</span></div>{message && <p className="mt-3 text-xs font-bold text-muted" role="status">{message}</p>}</div>;
}
