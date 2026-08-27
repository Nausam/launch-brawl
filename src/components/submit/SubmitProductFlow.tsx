"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlignLeft, CalendarDays, Check, Globe, ImageIcon, Link2, LoaderCircle, ScanSearch, Share2, Sparkles, Tags, type LucideIcon } from "lucide-react";
import type { Category, PricingType } from "@/lib/types";
import { ProductLogo } from "@/components/products/ProductLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { cn } from "@/lib/utils";

type Step = "url" | "loading" | "review" | "success";

type Draft = {
  websiteUrl: string;
  name: string;
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

const emptyDraft: Draft = {
  websiteUrl: "",
  name: "",
  shortDescription: "",
  fullDescription: "",
  categoryId: "saas",
  pricingType: "Free",
  logoUrl: "",
  coverImageUrl: "",
  launchDate: new Date().toISOString().slice(0, 10),
  launchTagline: "",
  launchEventType: "",
  launchEventAt: "",
  launchEventUrl: "",
  socialLinks: { x: "", github: "", linkedin: "", discord: "", youtube: "" },
};

const pullCards: Array<{ icon: LucideIcon; title: string; copy: string; tone: "gold" | "bronze" | "silver" | "coral" }> = [
  { icon: Sparkles, title: "Name", copy: "Title and mark from the public page.", tone: "gold" },
  { icon: AlignLeft, title: "Story", copy: "A first-pass description you can rewrite.", tone: "bronze" },
  { icon: ImageIcon, title: "Logo", copy: "Favicon or og image if one is public.", tone: "silver" },
  { icon: Tags, title: "Shelf", copy: "A guessed category before review.", tone: "coral" },
];

const scanLines = [
  "Opening the public page",
  "Reading the title and story",
  "Looking for a mark",
  "Guessing a shelf",
] as const;

const socialLabels = {
  x: "X / Twitter",
  github: "GitHub",
  linkedin: "LinkedIn",
  discord: "Discord",
  youtube: "YouTube",
} as const;

const inputClass =
  "mt-2 w-full rounded-[17px] rounded-br-[8px] border border-line bg-white/80 px-4 py-3 text-sm outline-none shadow-[2px_2px_0_#e5e2da] transition placeholder:text-muted/70 focus:border-ink focus:bg-white";

export function SubmitProductFlow({ variant = "page", onClose, initialCategories = [] }: { variant?: "page" | "modal"; onClose?: () => void; initialCategories?: Category[] }) {
  const router = useRouter();
  const titleId = useId();
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [productId, setProductId] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/products/draft")
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!active) return;
        const saved = payload?.draft as Partial<Draft> | null | undefined;
        if (saved) {
          const restored: Draft = {
            ...emptyDraft,
            ...saved,
            socialLinks: { ...emptyDraft.socialLinks, ...(saved.socialLinks ?? {}) },
          };
          setDraft(restored);
          setUrl(restored.websiteUrl);
          if (restored.name || restored.shortDescription || restored.fullDescription) {
            setNotice("Your saved submission draft is ready to review.");
            setStep("review");
          }
        }
        setDraftLoaded(true);
      })
      .catch(() => { if (active) setDraftLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!draftLoaded || step !== "review") return;
    const timer = window.setTimeout(() => {
      void fetch("/api/products/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      }).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, draftLoaded, step]);

  useEffect(() => {
    if (categories.length) return;
    void fetch("/api/categories").then((response) => response.ok ? response.json() : null).then((payload) => {
      if (Array.isArray(payload?.categories)) setCategories(payload.categories as Category[]);
    }).catch(() => undefined);
  }, [categories.length]);

  const lookup = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setStep("loading");
    const response = await fetch("/api/products/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 400 || response.status === 429) {
      setStep("url");
      setError(typeof payload.error === "string" ? payload.error : "Enter a valid website URL.");
      return;
    }
    const preview = payload.preview as Partial<Draft> | undefined;
    setDraft({
      websiteUrl: preview?.websiteUrl || normalizeClientUrl(url),
      name: preview?.name || "",
      shortDescription: preview?.shortDescription || "",
      fullDescription: preview?.fullDescription || "",
      categoryId: preview?.categoryId || "saas",
      pricingType: preview?.pricingType || "Free",
      logoUrl: preview?.logoUrl || "",
      coverImageUrl: preview?.coverImageUrl || "",
      launchDate: preview?.launchDate || new Date().toISOString().slice(0, 10),
      launchTagline: "",
      launchEventType: "",
      launchEventAt: "",
      launchEventUrl: "",
      socialLinks: preview?.socialLinks || { x: "", github: "", linkedin: "", discord: "", youtube: "" },
    });
    setNotice(payload.ok === false && typeof payload.error === "string" ? payload.error : "We filled this from the public page. Tweak anything that looks off.");
    setStep("review");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        logoUrl: draft.logoUrl || undefined,
        coverImageUrl: draft.coverImageUrl || undefined,
        launchMetadata: draft.launchTagline || draft.launchEventType || draft.launchEventAt || draft.launchEventUrl ? {
          tagline: draft.launchTagline || undefined,
          eventType: draft.launchEventType || undefined,
          eventAt: draft.launchEventAt || undefined,
          eventUrl: draft.launchEventUrl || undefined,
        } : undefined,
        socialLinks: Object.fromEntries(Object.entries(draft.socialLinks).filter(([, value]) => value.trim())) as Draft["socialLinks"],
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.status === 401) {
      router.push("/sign-in");
      return;
    }
    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "Could not submit this product.");
      return;
    }
    setProductId(typeof payload.id === "string" ? payload.id : "");
    setStep("success");
    void fetch("/api/products/draft", { method: "DELETE" }).catch(() => undefined);
    router.refresh();
  };

  const frame = (body: ReactNode, footer?: ReactNode) => (
    <div className={cn(variant === "modal" ? "relative flex min-h-0 flex-1 flex-col" : "rounded-[28px] rounded-br-[12px] border border-line bg-paper p-6 sm:p-8")}>
      <div className={cn("shrink-0", variant === "modal" && "px-6 pt-6 pr-16 sm:px-8 sm:pt-8")}>
        <StepTrail step={step} />
      </div>
      <div className={cn(variant === "modal" ? "min-h-0 flex-1 overflow-y-auto px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7" : "mt-7")}>
        {body}
      </div>
      {footer}
    </div>
  );

  switch (step) {
    case "url":
      return frame(
        <form onSubmit={lookup} className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,.85fr)] lg:items-end lg:gap-10">
          <div>
            <StepEyebrow>Start with a link</StepEyebrow>
            <h2 id={variant === "modal" ? "submit-product-title" : titleId} className="display mt-4 max-w-xl text-3xl font-black leading-[.95] tracking-[-0.05em] sm:text-5xl">Drop the website. We&apos;ll draft the card.</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted">Name, story, logo, and a first-pass category come from the public page. You edit everything before it goes to review.</p>
            <label className="mt-7 block">
              <span className="eyebrow text-muted">Website URL</span>
              <span className="mt-2 flex items-center gap-3 rounded-[17px] rounded-br-[8px] border border-line bg-white px-3 py-2 shadow-[2px_2px_0_#e5e2da] focus-within:border-ink">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]">
                  <Globe size={16} />
                </span>
                <input
                  autoFocus
                  required
                  type="url"
                  autoComplete="url"
                  inputMode="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://yourproduct.com"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted/70"
                />
                <Link2 size={16} className="mr-1 hidden shrink-0 text-muted sm:block" />
              </span>
            </label>
            {error ? <p className="mt-4 text-sm font-bold text-coral" role="alert">{error}</p> : null}
            <div className="mt-6 flex flex-col items-start gap-3">
              <Button type="submit" variant="primary" size="md" arrow className="h-11 shrink-0 whitespace-nowrap px-5">
                Look it up
              </Button>
              <p className="text-xs leading-5 text-muted">Landing pages, docs, and Product Hunt links all work.</p>
            </div>
          </div>
          <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {pullCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="flex items-start gap-3 rounded-[17px] rounded-br-[8px] border border-line bg-white/70 px-4 py-4 shadow-[2px_2px_0_#e5e2da]">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border", pullTone(card.tone))}>
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">{card.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{card.copy}</p>
                  </div>
                </div>
              );
            })}
          </aside>
        </form>,
      );
    case "loading":
      return frame(
        <div>
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-[16px] rounded-br-[7px] border border-coral/30 bg-coral/10 text-coral">
              <LoaderCircle size={22} className="animate-spin" />
            </span>
            <div>
              <StepEyebrow>Reading the page</StepEyebrow>
              <h2 id={variant === "modal" ? "submit-product-title" : titleId} className="display mt-3 text-3xl font-black leading-[.95] tracking-[-0.05em] sm:text-4xl">Pulling the public details.</h2>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-[16px] rounded-br-[7px] border border-line bg-white/80 px-3 py-3 shadow-[2px_2px_0_#e5e2da]">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] rounded-br-[5px] border border-line bg-paper-strong text-muted">
              <ScanSearch size={16} />
            </span>
            <p className="truncate text-sm font-bold text-ink">{url}</p>
          </div>
          <ul className="mt-6 grid gap-3">
            {scanLines.map((line, index) => (
              <li key={line} className="flex items-center gap-3 rounded-[16px] rounded-br-[7px] border border-line bg-white/70 px-3 py-3 shadow-[2px_2px_0_#e5e2da]">
                <span className="h-2.5 w-2.5 rounded-full bg-coral animate-pulse-soft" style={{ animationDelay: `${index * 180}ms` }} />
                <span className="text-sm font-bold text-ink">{line}</span>
                <span className="ml-auto h-3 w-24 animate-pulse-soft rounded bg-paper-strong" style={{ animationDelay: `${index * 180}ms` }} />
              </li>
            ))}
          </ul>
        </div>,
      );
    case "review":
      return frame(
        <form id="submit-product-review" onSubmit={submit} className="grid gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <StepEyebrow>Looks like this</StepEyebrow>
              <h2 id={variant === "modal" ? "submit-product-title" : titleId} className="display mt-3 text-3xl font-black leading-[.95] tracking-[-0.05em] sm:text-4xl">Check the card, then send it in.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{notice}</p>
            </div>
            <ReviewPreview draft={draft} />
          </div>
          <Section icon={Sparkles} title="The card" hint="What people see first.">
            <Field label="Product name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} required />
            <Field label="Website URL" value={draft.websiteUrl} onChange={(value) => setDraft({ ...draft, websiteUrl: value })} type="url" required />
            <Field label="Logo URL" value={draft.logoUrl} onChange={(value) => setDraft({ ...draft, logoUrl: value })} type="url" />
            <Field label="Cover image URL" value={draft.coverImageUrl} onChange={(value) => setDraft({ ...draft, coverImageUrl: value })} type="url" />
            <div className="rounded-[17px] rounded-br-[8px] border border-dashed border-line bg-paper-strong/40 px-5 py-4 shadow-[2px_2px_0_#e5e2da]">
              <ImageUploadField kind="logo" label="Or upload a logo" value={draft.logoUrl} onChange={(value) => setDraft({ ...draft, logoUrl: value })} />
            </div>
            <div className="rounded-[17px] rounded-br-[8px] border border-dashed border-line bg-paper-strong/40 px-5 py-4 shadow-[2px_2px_0_#e5e2da]">
              <ImageUploadField kind="cover" label="Or upload a cover" value={draft.coverImageUrl} onChange={(value) => setDraft({ ...draft, coverImageUrl: value })} />
            </div>
          </Section>
          <Section icon={AlignLeft} title="The story" hint="Keep the first line tight.">
            <Field label="Short description" value={draft.shortDescription} onChange={(value) => setDraft({ ...draft, shortDescription: value })} className="sm:col-span-2" required />
            <label className="sm:col-span-2">
              <span className="eyebrow text-muted">Full description</span>
              <textarea required rows={4} value={draft.fullDescription} onChange={(event) => setDraft({ ...draft, fullDescription: event.target.value })} className={cn(inputClass, "resize-none")} />
            </label>
            <label>
              <span className="eyebrow text-muted">Category</span>
              <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} className={inputClass}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span className="eyebrow text-muted">Pricing</span>
              <select value={draft.pricingType} onChange={(event) => setDraft({ ...draft, pricingType: event.target.value as PricingType })} className={inputClass}>
                <option>Free</option>
                <option>Freemium</option>
                <option>Paid</option>
                <option>Open source</option>
              </select>
            </label>
          </Section>
          <Section icon={CalendarDays} title="Launch day" hint="Optional event details stay off the card until you add them.">
            <Field label="Launch date" value={draft.launchDate} onChange={(value) => setDraft({ ...draft, launchDate: value })} type="date" required />
            <Field label="Launch tagline (optional)" value={draft.launchTagline} onChange={(value) => setDraft({ ...draft, launchTagline: value })} placeholder="What should people know about launch day?" />
            <label>
              <span className="eyebrow text-muted">Launch event</span>
              <select value={draft.launchEventType} onChange={(event) => setDraft({ ...draft, launchEventType: event.target.value as Draft["launchEventType"] })} className={inputClass}>
                <option value="">No event</option>
                <option value="LAUNCH">Launch event</option>
                <option value="DEMO">Live demo</option>
                <option value="WEBINAR">Webinar</option>
                <option value="RELEASE">Release moment</option>
              </select>
            </label>
            {draft.launchEventType ? (
              <>
                <Field label="Event date and time" value={draft.launchEventAt} onChange={(value) => setDraft({ ...draft, launchEventAt: value })} type="datetime-local" />
                <Field label="Event URL" value={draft.launchEventUrl} onChange={(value) => setDraft({ ...draft, launchEventUrl: value })} type="url" />
              </>
            ) : null}
          </Section>
          <Section icon={Share2} title="Elsewhere" hint="Optional. Only filled links are saved.">
            {(["x", "github", "linkedin", "discord", "youtube"] as const).map((key) => (
              <Field key={key} label={socialLabels[key]} value={draft.socialLinks[key]} onChange={(value) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, [key]: value } })} type="url" />
            ))}
          </Section>
          {error ? <p className="text-sm font-bold text-coral" role="alert">{error}</p> : null}
        </form>,
        <div className={cn("shrink-0 border-t border-line bg-paper/95 px-6 py-4 backdrop-blur sm:px-8", variant === "page" && "-mx-6 mt-6 border-t border-line px-6 sm:-mx-8 sm:px-8")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" onClick={() => setStep("url")} variant="ghost" size="xs" className="px-0">Use a different URL</Button>
            <Button type="submit" form="submit-product-review" disabled={busy} variant="primary" size="md" arrow className="h-11 shrink-0 whitespace-nowrap px-5">
              {busy ? "Submitting…" : "Submit for review"}
            </Button>
          </div>
        </div>,
      );
    case "success":
      return frame(
        <div className="overflow-hidden rounded-[17px] rounded-br-[8px] border border-[#a7dacc] bg-[linear-gradient(180deg,#f3fbf8,#d9efe9)] px-5 py-8 shadow-[2px_2px_0_#a7dacc] sm:px-8">
          <span className="grid h-14 w-14 place-items-center rounded-[16px] rounded-br-[7px] border border-[#2d7667] bg-[#2d7667] text-white">
            <Check size={24} />
          </span>
          <h2 id={variant === "modal" ? "submit-product-title" : titleId} className="display mt-6 text-3xl font-black leading-[.95] tracking-[-0.05em] sm:text-4xl">You&apos;re on the runway.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">Your listing is queued for review and attached to this signed-in account. It stays off the public board until a human clears it.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard/products" variant="dark" size="md" arrow>Open my products</ButtonLink>
            {productId ? (
              <ButtonLink href={`/dashboard/products/${productId}`} variant="outline" size="md">View this listing</ButtonLink>
            ) : null}
            {onClose ? (
              <Button onClick={onClose} variant="outline" size="md">Done</Button>
            ) : (
              <Button onClick={() => { setStep("url"); setUrl(""); setDraft(emptyDraft); void fetch("/api/products/draft", { method: "DELETE" }).catch(() => undefined); }} variant="outline" size="md">Submit another</Button>
            )}
          </div>
        </div>,
      );
    default: {
      const _never: never = step;
      return _never;
    }
  }
}

function StepTrail({ step }: { step: Step }) {
  const current = stepIndex(step);
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Submission steps">
      {trailSteps.map((item, index) => {
        const Icon = item.icon;
        const state = index < current ? "done" : index === current ? "active" : "todo";
        return (
          <li key={item.id} className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]", trailStyle(state))}>
              <span className={cn("grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border", trailTile(state))}>
                {state === "done" ? <Check size={12} /> : <Icon size={12} />}
              </span>
              <span className={index === current ? "inline" : "hidden sm:inline"}>{item.label}</span>
            </span>
            {index < trailSteps.length - 1 ? <span className="hidden h-px w-4 bg-line sm:block" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}

const trailSteps: Array<{ id: Step; label: string; icon: LucideIcon }> = [
  { id: "url", label: "Link", icon: Link2 },
  { id: "loading", label: "Read", icon: ScanSearch },
  { id: "review", label: "Review", icon: AlignLeft },
  { id: "success", label: "Queued", icon: Check },
];

function stepIndex(step: Step) {
  switch (step) {
    case "url":
      return 0;
    case "loading":
      return 1;
    case "review":
      return 2;
    case "success":
      return 3;
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

function trailStyle(state: "done" | "active" | "todo") {
  switch (state) {
    case "done":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    case "active":
      return "border-coral-dark bg-coral text-white";
    case "todo":
      return "border-line bg-white/70 text-muted";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function trailTile(state: "done" | "active" | "todo") {
  switch (state) {
    case "done":
      return "border-[#b7cfe0] bg-white text-[#355875]";
    case "active":
      return "border-white/30 bg-white/15 text-white";
    case "todo":
      return "border-line bg-paper-strong text-muted";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function pullTone(tone: "gold" | "bronze" | "silver" | "coral") {
  switch (tone) {
    case "gold":
      return "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]";
    case "bronze":
      return "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf6,#f8e0c8,#e2b189)] text-[#9b5d2d]";
    case "silver":
      return "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]";
    case "coral":
      return "border-coral/30 bg-coral/10 text-coral";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function StepEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral">
      {children}
    </div>
  );
}

function Section({ icon: Icon, title, hint, children }: { icon: LucideIcon; title: string; hint: string; children: ReactNode }) {
  return (
    <section className="rounded-[17px] rounded-br-[8px] border border-line bg-white p-6 shadow-[2px_2px_0_#e5e2da] sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-line bg-paper-strong text-ink">
          <Icon size={15} />
        </span>
        <div>
          <h3 className="text-sm font-black text-ink">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-muted">{hint}</p>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ReviewPreview({ draft }: { draft: Draft }) {
  return (
    <div className="flex min-w-[220px] items-center gap-3 rounded-[17px] rounded-br-[8px] border border-line bg-white px-4 py-3 shadow-[2px_2px_0_#e5e2da]">
      <ProductLogo product={{ name: draft.name || "Product", color: "#ff6b4a", logoUrl: draft.logoUrl, websiteUrl: draft.websiteUrl }} size="lg" className="rounded-[16px] rounded-br-[7px]" />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-ink">{draft.name || "Untitled product"}</p>
        <p className="mt-1 truncate text-xs text-muted">{draft.websiteUrl || "No URL yet"}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={className}>
      <span className="eyebrow text-muted">{label}</span>
      <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

function normalizeClientUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function SubmitPageHint() {
  return (
    <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted">
      <Sparkles size={14} className="mt-0.5 shrink-0 text-coral" />
      Free listings are always welcome. You can submit now and decide later if sponsored reach is right for your launch.
    </p>
  );
}
