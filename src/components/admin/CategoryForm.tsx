"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  accent: string;
  displayOrder: string;
};

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  icon: "▣",
  accent: "#7254CA",
  displayOrder: "",
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export function CategoryForm() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          description: form.description || undefined,
          icon: form.icon,
          accent: form.accent,
          displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,
        }),
      });
      const result = await response.json().catch(() => ({})) as { category?: { name?: string }; error?: string };
      if (!response.ok) {
        setError(result.error ?? "The category could not be saved.");
        return;
      }
      setForm(emptyForm);
      setSlugEdited(false);
      setMessage(`${result.category?.name ?? "Category"} added.`);
      router.refresh();
    } catch {
      setError("The category service is unavailable right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[24px] rounded-br-[10px] border border-ink bg-ink p-6 text-white">
      <div className="eyebrow text-coral">Catalog control</div>
      <h2 className="display mt-2 text-2xl font-black">Add a category</h2>
      <p className="mt-2 max-w-xl text-xs leading-5 text-white/65">New categories become available in discovery, leagues, and the product submission form immediately after they are saved.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-xs font-bold">
          <span className="text-white/65">Name</span>
          <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: slugEdited ? current.slug : slugify(event.target.value) }))} placeholder="Web3" className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white outline-none placeholder:text-white/35 focus:border-coral" />
        </label>
        <label className="grid gap-2 text-xs font-bold">
          <span className="text-white/65">Slug</span>
          <input required value={form.slug} onChange={(event) => { setSlugEdited(true); setForm((current) => ({ ...current, slug: slugify(event.target.value) })); }} placeholder="web3" className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white outline-none placeholder:text-white/35 focus:border-coral" />
        </label>
        <label className="grid gap-2 text-xs font-bold">
          <span className="text-white/65">Description</span>
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Tools and products in this category." rows={3} className="resize-y rounded-lg border border-white/15 bg-white/5 px-3 py-3 text-sm font-medium text-white outline-none placeholder:text-white/35 focus:border-coral" />
        </label>
        <div className="grid gap-4 sm:grid-cols-[1fr_92px]">
          <label className="grid gap-2 text-xs font-bold">
            <span className="text-white/65">Icon</span>
            <input required value={form.icon} onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))} maxLength={8} placeholder="◈" className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white outline-none placeholder:text-white/35 focus:border-coral" />
          </label>
          <label className="grid gap-2 text-xs font-bold">
            <span className="text-white/65">Accent</span>
            <input type="color" value={form.accent} onChange={(event) => setForm((current) => ({ ...current, accent: event.target.value }))} className="h-11 w-full cursor-pointer rounded-lg border border-white/15 bg-white/5 p-1" aria-label="Category accent color" />
          </label>
        </div>
        <label className="grid gap-2 text-xs font-bold">
          <span className="text-white/65">Display order <span className="font-normal text-white/40">(optional)</span></span>
          <input type="number" min="0" max="10000" value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))} placeholder="Added last automatically" className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white outline-none placeholder:text-white/35 focus:border-coral" />
        </label>
        <Button type="submit" disabled={busy} variant="primary" size="md" className="mt-2">{busy ? "Adding…" : "Add category"}</Button>
      </form>
      {message && <p className="mt-4 text-xs font-bold text-[#a7e4bf]" role="status">{message}</p>}
      {error && <p className="mt-4 text-xs font-bold text-[#ffb5a7]" role="alert">{error}</p>}
    </section>
  );
}
