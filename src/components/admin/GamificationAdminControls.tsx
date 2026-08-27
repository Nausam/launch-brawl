"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Message = { kind: "ok" | "error"; text: string } | null;

export function SeasonAdminForm() {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: form.get("id") || undefined, name: form.get("name"), startsAt: form.get("startsAt"), endsAt: form.get("endsAt"), current: form.get("current") === "on" }) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? { kind: "ok", text: "Season created." } : { kind: "error", text: payload.error ?? "Season could not be created." });
    if (response.ok) { event.currentTarget.reset(); router.refresh(); }
  };
  return <AdminForm title="Create a season" message={message} onSubmit={submit}><Field name="id" label="Stable ID / slug" placeholder="season-2026-01" /><Field name="name" label="Name" placeholder="Season 1" required /><div className="grid gap-3 sm:grid-cols-2"><Field name="startsAt" label="Starts" type="datetime-local" required /><Field name="endsAt" label="Ends" type="datetime-local" required /></div><label className="flex items-center gap-2 text-xs font-bold"><input name="current" type="checkbox" className="accent-[#ff6b4a]" />Make current season</label><Button type="submit" variant="primary" size="sm">Create season</Button></AdminForm>;
}

export function QuestAdminForm() {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/quests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: form.get("id") || undefined, type: form.get("type"), title: form.get("title"), description: form.get("description"), target: Number(form.get("target")), xpReward: Number(form.get("xpReward")), active: true, version: 1 }) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? { kind: "ok", text: "Quest template created." } : { kind: "error", text: payload.error ?? "Quest template could not be created." });
    if (response.ok) { event.currentTarget.reset(); router.refresh(); }
  };
  return <AdminForm title="Create a quest template" message={message} onSubmit={submit}><Field name="id" label="Stable ID" placeholder="vote-brawls" /><Select name="type" label="Type" options={["VOTE_BRAWLS", "DISCOVER_PRODUCTS", "PREDICT_BRAWLS", "VISIT_CATEGORIES", "DAILY_PICKS"]} /><Field name="title" label="Title" placeholder="Vote in 3 Brawls" required /><Field name="description" label="Description" placeholder="Make three considered community votes." required /><div className="grid gap-3 sm:grid-cols-2"><Field name="target" label="Target" type="number" placeholder="3" required /><Field name="xpReward" label="XP reward" type="number" placeholder="15" required /></div><Button type="submit" variant="primary" size="sm">Create template</Button></AdminForm>;
}

export function BountyAdminForm() {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/bounties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: form.get("type"), title: form.get("title"), description: form.get("description"), xpReward: Number(form.get("xpReward")), startsAt: form.get("startsAt"), endsAt: form.get("endsAt"), requirements: {} }) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? { kind: "ok", text: "Bounty created." } : { kind: "error", text: payload.error ?? "Bounty could not be created." });
    if (response.ok) { event.currentTarget.reset(); router.refresh(); }
  };
  return <AdminForm title="Create a bounty" message={message} onSubmit={submit}><Select name="type" label="Type" options={["DEFEAT_BOSS", "BREAK_STREAK", "GIANT_KILLER"]} /><Field name="title" label="Title" placeholder="Defeat the Boss" required /><Field name="description" label="Description" placeholder="Win an eligible Boss Brawl." required /><Field name="xpReward" label="XP reward" type="number" placeholder="100" required /><div className="grid gap-3 sm:grid-cols-2"><Field name="startsAt" label="Starts" type="datetime-local" required /><Field name="endsAt" label="Ends" type="datetime-local" required /></div><Button type="submit" variant="primary" size="sm">Create bounty</Button></AdminForm>;
}

function AdminForm({ title, message, onSubmit, children }: { title: string; message: Message; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: React.ReactNode }) {
  return <form onSubmit={onSubmit} className="rounded-[24px] rounded-br-[10px] border-2 border-[#d6e3ef] bg-white/80 p-5"><h2 className="display text-2xl font-black tracking-[-0.04em]">{title}</h2><div className="mt-5 grid gap-4">{children}</div>{message ? <p className={`mt-4 text-xs font-bold ${message.kind === "error" ? "text-coral" : "text-[#3E8E65]"}`} role="status">{message.text}</p> : null}</form>;
}

function Field({ name, label, placeholder, type = "text", required = false }: { name: string; label: string; placeholder?: string; type?: string; required?: boolean }) {
  return <label><span className="eyebrow text-muted">{label}</span><input name={name} type={type} placeholder={placeholder} required={required} className="mt-2 w-full border border-line bg-paper-strong/45 px-3 py-2.5 text-sm outline-none focus:border-ink" /></label>;
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return <label><span className="eyebrow text-muted">{label}</span><select name={name} className="mt-2 w-full border border-line bg-paper-strong/45 px-3 py-2.5 text-sm outline-none focus:border-ink">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
