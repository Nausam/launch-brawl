"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function DealForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ productId: products[0]?.id ?? "", title: "", description: "", terms: "", couponCode: "", destinationUrl: "", startsAt: "", expiresAt: "", status: "DRAFT" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: form.status }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      setMessage(response.ok ? "Deal saved." : result.error ?? "The deal could not be saved.");
      if (response.ok) { setForm((current) => ({ ...current, title: "", description: "", terms: "", couponCode: "", destinationUrl: "", startsAt: "", expiresAt: "" })); router.refresh(); }
    } catch { setMessage("The deal service is unavailable right now."); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="rounded-[24px] rounded-br-[10px] border border-ink bg-ink p-6 text-white"><div className="eyebrow text-coral">Offer control</div><h2 className="display mt-2 text-2xl font-black">Create a deal</h2><div className="mt-6 grid gap-4"><label className="grid gap-2 text-xs font-bold"><span className="text-white/65">Product</span><select required value={form.productId} onChange={(event) => update("productId", event.target.value)} className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-coral">{products.map((product) => <option key={product.id} value={product.id} className="text-ink">{product.name}</option>)}</select></label><Field label="Title" value={form.title} onChange={(value) => update("title", value)} required /><Field label="Description" value={form.description} onChange={(value) => update("description", value)} /><Field label="Terms" value={form.terms} onChange={(value) => update("terms", value)} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Coupon code" value={form.couponCode} onChange={(value) => update("couponCode", value)} /><Field label="Destination URL" type="url" value={form.destinationUrl} onChange={(value) => update("destinationUrl", value)} /></div><div className="grid gap-4 sm:grid-cols-3"><Field label="Starts" type="datetime-local" value={form.startsAt} onChange={(value) => update("startsAt", value)} /><Field label="Expires" type="datetime-local" value={form.expiresAt} onChange={(value) => update("expiresAt", value)} /><label className="grid gap-2 text-xs font-bold"><span className="text-white/65">Status</span><select value={form.status} onChange={(event) => update("status", event.target.value)} className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-coral"><option className="text-ink" value="DRAFT">Draft</option><option className="text-ink" value="ACTIVE">Active</option></select></label></div><Button type="submit" variant="primary" size="md" disabled={busy || !products.length}>{busy ? "Saving…" : "Save deal"}</Button></div>{message && <p className="mt-4 text-xs font-bold text-white/75" role="status">{message}</p>}</form>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="grid gap-2 text-xs font-bold"><span className="text-white/65">{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-coral" /></label>;
}
