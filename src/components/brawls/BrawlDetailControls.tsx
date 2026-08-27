"use client";

import { useState } from "react";
import { Check, Flame, Sparkles, Target, Zap } from "lucide-react";
import type { Brawl, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function BrawlDetailControls({ brawl, left, right }: { brawl: Brawl; left: Product; right: Product }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const live = brawl.status === "LIVE";

  const vote = async () => {
    if (!choice || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/brawls/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brawlId: brawl.id, selectedProductId: choice }) });
      const result = await response.json() as { ok?: boolean; message?: string; error?: string };
      setStatus(result.message ?? result.error ?? "Vote submitted.");
    } catch { setStatus("The Brawl service is unavailable. Try again."); } finally { setBusy(false); }
  };

  const predict = async () => {
    if (!prediction || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/brawls/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brawlId: brawl.id, predictedProductId: prediction }) });
      const result = await response.json() as { message?: string; error?: string };
      setStatus(result.message ?? result.error ?? "Prediction submitted.");
    } catch { setStatus("The prediction service is unavailable. Try again."); } finally { setBusy(false); }
  };

  const submitRematch = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/brawls/${brawl.id}/rematch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const result = await response.json() as { message?: string; error?: string };
      setStatus(result.message ?? result.error ?? "Rematch requested.");
    } catch { setStatus("The rematch service is unavailable. Try again."); } finally { setBusy(false); }
  };

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2">
      <div className="relative flex h-full min-h-[224px] flex-col overflow-hidden rounded-[16px] rounded-br-[7px] border border-line bg-paper p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted"><Target size={15} className="text-coral" />Community vote</div>
        <p className="mt-2 min-h-10 text-xs leading-5 text-muted">Choose the product you want to see move forward.</p>
        <div className="mt-4 grid min-h-12 grid-cols-2 gap-2"><ChoiceButton label={left.name} selected={choice === left.id} disabled={!live} onClick={() => setChoice(left.id)} /><ChoiceButton label={right.name} selected={choice === right.id} disabled={!live} onClick={() => setChoice(right.id)} /></div>
        <Button type="button" onClick={vote} disabled={!live || !choice || busy} variant={live ? "dark" : "outline"} size="sm" className="mt-auto self-start">{busy ? "Counting…" : "Lock vote"}<Zap size={14} />+2 XP</Button>
      </div>
      <div className="relative flex h-full min-h-[224px] flex-col overflow-hidden rounded-[16px] rounded-br-[7px] border border-line bg-paper p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted"><Sparkles size={15} className="text-[#7c5cdb]" />Your prediction</div>
        <p className="mt-2 min-h-10 text-xs leading-5 text-muted">Prediction is separate from voting and closes before the final stretch.</p>
        <div className="mt-4 grid min-h-12 grid-cols-2 gap-2"><ChoiceButton label={left.name} selected={prediction === left.id} disabled={!live} onClick={() => setPrediction(left.id)} /><ChoiceButton label={right.name} selected={prediction === right.id} disabled={!live} onClick={() => setPrediction(right.id)} /></div>
        <Button type="button" onClick={predict} disabled={!live || !prediction || busy} variant="violet" size="sm" className="mt-auto self-start">Save prediction <Flame size={14} /></Button>
      </div>
      {brawl.status === "COMPLETED" && <Button type="button" onClick={submitRematch} disabled={busy} variant="secondary" size="sm" icon={<Check size={14} />} className="md:col-span-2">Request a rematch</Button>}
      {status && <p className="md:col-span-2 border-t border-line pt-3 text-xs font-bold text-muted" role="status">{status}</p>}
    </div>
  );
}

function ChoiceButton({ label, selected, disabled, onClick }: { label: string; selected: boolean; disabled: boolean; onClick: () => void }) {
  return <Button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} unstyled className={cn("min-w-0 truncate rounded-[14px] rounded-br-[6px] border px-3 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45", selected ? "border-coral bg-coral/10 text-ink" : "border-line bg-paper text-muted hover:border-ink/30")}>{selected && <Check size={13} className="mr-1 inline" />}{label}</Button>;
}
