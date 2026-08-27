"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function BrawlScheduler({ products }: { products: Product[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ productAId: products[0]?.id ?? "", productBId: products[1]?.id ?? "", prompt: "Which product would you choose?", startsAt: "", endsAt: "", bossBrawl: false, bossProductId: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/brawls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: "SCHEDULED", bossProductId: form.bossBrawl ? form.bossProductId : undefined }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      setMessage(response.ok ? "Brawl scheduled." : result.error ?? "The Brawl could not be scheduled.");
      if (response.ok) router.refresh();
    } catch { setMessage("The Brawl service is unavailable right now."); }
    finally { setBusy(false); }
  };
  return <section className="rounded-[24px] rounded-br-[10px] border border-ink bg-ink p-6 text-white"><div className="eyebrow text-coral">Competitive control</div><h2 className="display mt-2 text-2xl font-black">Schedule a Brawl</h2><form onSubmit={submit} className="mt-6 grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><Select label="Product A" value={form.productAId} onChange={(value) => update("productAId", value)} products={products} /><Select label="Product B" value={form.productBId} onChange={(value) => update("productBId", value)} products={products} /></div><Field label="Question" value={form.prompt} onChange={(value) => update("prompt", value)} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Starts" type="datetime-local" value={form.startsAt} onChange={(value) => update("startsAt", value)} /><Field label="Ends" type="datetime-local" value={form.endsAt} onChange={(value) => update("endsAt", value)} /></div><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.bossBrawl} onChange={(event) => update("bossBrawl", event.target.checked)} />Boss Brawl</label>{form.bossBrawl && <Select label="Boss product" value={form.bossProductId} onChange={(value) => update("bossProductId", value)} products={products.filter((product) => product.id === form.productAId || product.id === form.productBId)} /> }<Button type="submit" variant="primary" size="md" disabled={busy || products.length < 2}>{busy ? "Scheduling…" : "Schedule Brawl"}</Button></form>{message && <p className="mt-4 text-xs font-bold text-white/75" role="status">{message}</p>}</section>;
}

function Select({ label, value, onChange, products }: { label: string; value: string; onChange: (value: string) => void; products: Product[] }) { return <label className="grid gap-2 text-xs font-bold"><span className="text-white/65">{label}</span><select required value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-coral"><option value="" className="text-ink">Choose product</option>{products.map((product) => <option key={product.id} value={product.id} className="text-ink">{product.name}</option>)}</select></label>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="grid gap-2 text-xs font-bold"><span className="text-white/65">{label}</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-coral" /></label>; }
