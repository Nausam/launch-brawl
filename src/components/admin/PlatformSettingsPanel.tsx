"use client";

import { useState } from "react";
import type { PlatformSettings } from "@/lib/server/settings";
import { Button } from "@/components/ui/Button";

export function PlatformSettingsPanel({ settings }: { settings: PlatformSettings }) {
  const [form, setForm] = useState({
    minimumBidDollars: (settings.minimumBidCents / 100).toFixed(2),
    minimumIncrementDollars: (settings.minimumIncrementCents / 100).toFixed(2),
    maximumBidDollars: (settings.maximumBidCents / 100).toFixed(2),
    promoImpressionsPerDollar: String(settings.promoImpressionsPerDollar),
    biddingPaused: settings.biddingPaused,
    newCampaignsPaused: settings.newCampaignsPaused,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        minimumBidCents: Math.round(Number(form.minimumBidDollars) * 100),
        minimumIncrementCents: Math.round(Number(form.minimumIncrementDollars) * 100),
        maximumBidCents: Math.round(Number(form.maximumBidDollars) * 100),
        promoImpressionsPerDollar: Number(form.promoImpressionsPerDollar),
        biddingPaused: form.biddingPaused,
        newCampaignsPaused: form.newCampaignsPaused,
        maintenanceMode: form.maintenanceMode,
        maintenanceMessage: form.maintenanceMessage,
      }) });
      const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
      setMessage(payload.message ?? payload.error ?? (response.ok ? "Settings saved." : "Settings could not be saved."));
    } catch {
      setMessage("The settings service is unavailable.");
    } finally {
      setBusy(false);
    }
  };
  return <section className="rounded-[24px] rounded-br-[10px] border-2 border-[#d6e3ef] bg-white/80 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="eyebrow text-coral">Firestore configuration</div><h2 className="display mt-2 text-2xl font-black">Commercial controls</h2><p className="mt-2 max-w-xl text-xs leading-5 text-muted">These values are read from and written to settings/platform. Changes affect new bids and campaign allocations only.</p></div><Button type="button" onClick={save} disabled={busy} variant="primary" size="sm">{busy ? "Saving…" : "Save settings"}</Button></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Minimum bid" value={form.minimumBidDollars} onChange={(value) => setForm({ ...form, minimumBidDollars: value })} suffix="USD" /><Field label="Minimum increment" value={form.minimumIncrementDollars} onChange={(value) => setForm({ ...form, minimumIncrementDollars: value })} suffix="USD" /><Field label="Maximum bid" value={form.maximumBidDollars} onChange={(value) => setForm({ ...form, maximumBidDollars: value })} suffix="USD" /><Field label="Promo impressions per dollar" value={form.promoImpressionsPerDollar} onChange={(value) => setForm({ ...form, promoImpressionsPerDollar: value })} suffix="impressions" /></div><div className="mt-5 grid gap-2 sm:grid-cols-2"><label className="flex items-center gap-3 border border-line bg-paper-strong/45 p-3 text-xs font-bold"><input type="checkbox" checked={form.biddingPaused} onChange={(event) => setForm({ ...form, biddingPaused: event.target.checked })} className="h-4 w-4 accent-[#ff6b4a]" />Pause new bids</label><label className="flex items-center gap-3 border border-line bg-paper-strong/45 p-3 text-xs font-bold"><input type="checkbox" checked={form.newCampaignsPaused} onChange={(event) => setForm({ ...form, newCampaignsPaused: event.target.checked })} className="h-4 w-4 accent-[#ff6b4a]" />Pause new campaigns</label><label className="flex items-center gap-3 border border-coral/40 bg-coral/5 p-3 text-xs font-bold sm:col-span-2"><input type="checkbox" checked={form.maintenanceMode} onChange={(event) => setForm({ ...form, maintenanceMode: event.target.checked })} className="h-4 w-4 accent-[#ff6b4a]" />Maintenance/read-only mode</label></div><label className="mt-4 block"><span className="eyebrow text-muted">Maintenance message</span><input value={form.maintenanceMessage} onChange={(event) => setForm({ ...form, maintenanceMessage: event.target.value })} className="mt-2 w-full border border-line bg-paper-strong/45 px-4 py-3 text-sm outline-none focus:border-ink" /></label>{message && <p className="mt-4 text-xs font-bold text-muted" role="status">{message}</p>}</section>;
}

function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix: string }) {
  return <label><span className="eyebrow text-muted">{label}</span><span className="mt-2 flex items-center border border-line bg-paper-strong/45"><input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent px-4 py-3 text-sm outline-none" /><span className="border-l border-line px-3 text-xs text-muted">{suffix}</span></span></label>;
}
