"use client";

import { useState } from "react";
import type { FeatureFlags } from "@/lib/types";
import { Button } from "@/components/ui/Button";

const labels: Array<[keyof FeatureFlags, string]> = [["submissionsEnabled", "Submissions"], ["votingEnabled", "Voting"], ["biddingEnabled", "Bidding"], ["campaignDeliveryEnabled", "Campaign delivery"], ["brawlsEnabled", "Brawls"], ["challengesEnabled", "Challenges"], ["predictionsEnabled", "Predictions"], ["questsEnabled", "Daily Quests"], ["dailyPicksEnabled", "Daily Picks"], ["leaguesEnabled", "Leagues"], ["bossBrawlsEnabled", "Boss Brawls"], ["bountiesEnabled", "Bounties"]];

export function FeatureFlagPanel({ initialFlags }: { initialFlags: FeatureFlags }) {
  const [flags, setFlags] = useState(initialFlags);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/feature-flags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(flags) });
      const result = await response.json() as { message?: string; error?: string };
      setMessage(result.message ?? result.error ?? "Flags saved.");
    } catch { setMessage("The admin settings service is unavailable."); } finally { setBusy(false); }
  };
  return <section className="rounded-[24px] rounded-br-[10px] border-2 border-[#d6e3ef] bg-white/80 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="eyebrow text-coral">Admin safety switch</div><h2 className="display mt-2 text-2xl font-black">Pause a system without taking the site down.</h2><p className="mt-2 max-w-xl text-xs leading-5 text-muted">These flags gate new organic actions server-side. Existing records remain readable.</p></div><Button type="button" onClick={save} disabled={busy} variant="primary" size="sm">{busy ? "Saving…" : "Save switches"}</Button></div><div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{labels.map(([key, label]) => <label key={key} className="flex items-center gap-3 border border-line bg-paper-strong/45 p-3 text-xs font-bold"><input type="checkbox" checked={flags[key]} onChange={(event) => setFlags((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-[#ff6b4a]" />{label}</label>)}</div>{message && <p className="mt-4 text-xs font-bold text-muted" role="status">{message}</p>}</section>;
}
