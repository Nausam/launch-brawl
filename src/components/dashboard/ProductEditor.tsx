"use client";

import { useState, type FormEvent } from "react";
import type { Category, Product, PricingType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/ui/ImageUploadField";

type FormState = {
  name: string;
  websiteUrl: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  pricingType: PricingType;
  logoUrl: string;
  coverImageUrl: string;
  launchDate: string;
  launchTagline: string;
  launchEventType: "" | "LAUNCH" | "DEMO" | "WEBINAR" | "RELEASE";
  launchEventAt: string;
  launchEventUrl: string;
  socialLinks: { x: string; github: string; linkedin: string; discord: string; youtube: string };
};

export function ProductEditor({ product, categories }: { product: Product; categories: Category[] }) {
  const [form, setForm] = useState<FormState>({
    name: product.name,
    websiteUrl: product.websiteUrl,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    categoryId: product.categoryId,
    pricingType: product.pricingType,
    logoUrl: product.logoUrl ?? "",
    coverImageUrl: product.coverImageUrl ?? "",
    launchDate: product.launchDate,
    launchTagline: product.launchMetadata?.tagline ?? "",
    launchEventType: product.launchMetadata?.eventType ?? "",
    launchEventAt: product.launchMetadata?.eventAt ? product.launchMetadata.eventAt.slice(0, 16) : "",
    launchEventUrl: product.launchMetadata?.eventUrl ?? "",
    socialLinks: {
      x: product.socialLinks?.x ?? "",
      github: product.socialLinks?.github ?? "",
      linkedin: product.socialLinks?.linkedin ?? "",
      discord: product.socialLinks?.discord ?? "",
      youtube: product.socialLinks?.youtube ?? "",
    },
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const response = await fetch(`/api/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, websiteUrl: form.websiteUrl, shortDescription: form.shortDescription, fullDescription: form.fullDescription, categoryId: form.categoryId, pricingType: form.pricingType, logoUrl: form.logoUrl || undefined, coverImageUrl: form.coverImageUrl || undefined, launchDate: form.launchDate, launchMetadata: form.launchTagline || form.launchEventType || form.launchEventAt || form.launchEventUrl ? { tagline: form.launchTagline || undefined, eventType: form.launchEventType || undefined, eventAt: form.launchEventAt || undefined, eventUrl: form.launchEventUrl || undefined } : {}, socialLinks: Object.fromEntries(Object.entries(form.socialLinks).filter(([, value]) => value.trim())) }) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    setStatus(response.ok ? "Saved. Published content changes are queued for moderation." : payload.error ?? "Could not save this product.");
  };
  const archive = async () => {
    if (!window.confirm("Archive this product? It will leave public discovery until restored by an administrator.")) return;
    setBusy(true);
    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    setStatus(response.ok ? "Product archived." : payload.error ?? "Could not archive this product.");
  };
  return <form onSubmit={submit} className="rounded-[24px] rounded-br-[10px] border-2 border-[#d6e3ef] bg-white/80 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral">Listing editor</div><h2 className="display mt-3 text-2xl font-black tracking-[-0.04em]">Keep the signal current.</h2><p className="mt-2 max-w-xl text-xs leading-5 text-muted">Material edits to a published listing return to moderation before they appear publicly.</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => void archive()} disabled={busy}>Archive</Button><Button type="submit" variant="primary" size="sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Product name" value={form.name} onChange={(value) => update("name", value)} required /><Field label="Website URL" type="url" value={form.websiteUrl} onChange={(value) => update("websiteUrl", value)} required /><Field label="Logo URL" type="url" value={form.logoUrl} onChange={(value) => update("logoUrl", value)} /><Field label="Cover image URL" type="url" value={form.coverImageUrl} onChange={(value) => update("coverImageUrl", value)} /><ImageUploadField kind="logo" label="Or upload a logo" value={form.logoUrl} onChange={(value) => update("logoUrl", value)} /><ImageUploadField kind="cover" label="Or upload a cover" value={form.coverImageUrl} onChange={(value) => update("coverImageUrl", value)} /><Field label="Launch date" type="date" value={form.launchDate} onChange={(value) => update("launchDate", value)} required /><Field label="Launch tagline (optional)" value={form.launchTagline} onChange={(value) => update("launchTagline", value)} placeholder="What should people know about launch day?" /><label><span className="eyebrow text-muted">Launch event</span><select value={form.launchEventType} onChange={(event) => update("launchEventType", event.target.value as FormState["launchEventType"])} className="mt-2 w-full border border-line bg-paper-strong/45 px-4 py-3 text-sm outline-none focus:border-ink"><option value="">No event</option><option value="LAUNCH">Launch event</option><option value="DEMO">Live demo</option><option value="WEBINAR">Webinar</option><option value="RELEASE">Release moment</option></select></label>{form.launchEventType ? <><Field label="Event date and time" type="datetime-local" value={form.launchEventAt} onChange={(value) => update("launchEventAt", value)} /><Field label="Event URL" type="url" value={form.launchEventUrl} onChange={(value) => update("launchEventUrl", value)} /></> : null}<label><span className="eyebrow text-muted">Category</span><select value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)} className="mt-2 w-full border border-line bg-paper-strong/45 px-4 py-3 text-sm outline-none focus:border-ink">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><Field label="Short description" value={form.shortDescription} onChange={(value) => update("shortDescription", value)} className="sm:col-span-2" required /><label className="sm:col-span-2"><span className="eyebrow text-muted">Full description</span><textarea required rows={6} value={form.fullDescription} onChange={(event) => update("fullDescription", event.target.value)} className="mt-2 w-full resize-y border border-line bg-paper-strong/45 px-4 py-3 text-sm outline-none focus:border-ink" /></label><div className="sm:col-span-2"><span className="eyebrow text-muted">Social links</span><div className="mt-2 grid gap-3 sm:grid-cols-2">{(["x", "github", "linkedin", "discord", "youtube"] as const).map((key) => <Field key={key} label={key === "x" ? "X / Twitter" : key[0].toUpperCase() + key.slice(1)} type="url" value={form.socialLinks[key]} onChange={(value) => update("socialLinks", { ...form.socialLinks, [key]: value })} />)}</div></div></div>{status && <p className="mt-5 text-sm font-bold text-muted" role="status">{status}</p>}</form>;
}

function Field({ label, value, onChange, type = "text", className = "", required = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string; required?: boolean; placeholder?: string }) {
  return <label className={className}><span className="eyebrow text-muted">{label}</span><input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-line bg-paper-strong/45 px-4 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-ink" /></label>;
}
