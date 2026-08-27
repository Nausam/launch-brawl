"use client";

import { CheckCircle2, XCircle, Archive, ArchiveRestore, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ModerationActions({ productId, status, featured }: { productId: string; status: string; featured: boolean }) {
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(action: "APPROVE" | "REJECT" | "ARCHIVE" | "UNARCHIVE" | "FEATURE" | "UNFEATURE") {
    if (!reason.trim()) {
      setMessage("Enter a reason before making this change.");
      return;
    }
    if (action === "ARCHIVE" && !window.confirm("Archive this product? It will leave public discovery.")) return;
    setBusy(true);
    const response = await fetch(`/api/admin/products/${productId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, reason: reason.trim() }) });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? String(payload.status ?? action) : String(payload.error ?? "Unable to update"));
    setBusy(false);
    if (response.ok) window.location.reload();
  }
  return <div className="flex flex-wrap items-center gap-2 sm:justify-end"><input aria-label="Moderation reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Reason required" className="h-8 min-w-32 border border-line bg-paper px-2 text-[10px] outline-none focus:border-ink" /><Button unstyled disabled={busy || status === "PUBLISHED"} onClick={() => void act("APPROVE")} title="Approve" aria-label="Approve" icon={<CheckCircle2 size={16} />} className="flex h-8 w-8 items-center justify-center rounded-full text-[#3E8E65] hover:bg-mint disabled:opacity-30" /><Button unstyled disabled={busy || status === "REJECTED"} onClick={() => void act("REJECT")} title="Reject" aria-label="Reject" icon={<XCircle size={16} />} className="flex h-8 w-8 items-center justify-center rounded-full text-coral hover:bg-coral/10 disabled:opacity-30" /><Button unstyled disabled={busy || status === "ARCHIVED"} onClick={() => void act("ARCHIVE")} title="Archive" aria-label="Archive" icon={<Archive size={16} />} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-paper-strong disabled:opacity-30" /><Button unstyled disabled={busy || status !== "ARCHIVED"} onClick={() => void act("UNARCHIVE")} title="Unarchive to moderation" aria-label="Unarchive to moderation" icon={<ArchiveRestore size={16} />} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-paper-strong disabled:opacity-30" /><Button unstyled disabled={busy || featured} onClick={() => void act("FEATURE")} title="Feature" aria-label="Feature" icon={<Star size={16} />} className="flex h-8 w-8 items-center justify-center rounded-full text-amber-600 hover:bg-amber-50 disabled:opacity-30" /><Button unstyled disabled={busy || !featured} onClick={() => void act("UNFEATURE")} title="Remove featured placement" aria-label="Remove featured placement" icon={<Star size={16} fill="currentColor" />} className="flex h-8 w-8 items-center justify-center rounded-full text-amber-600 hover:bg-amber-50 disabled:opacity-30" />{message && <span className="ml-2 text-[10px] text-muted" role="status">{message}</span>}</div>;
}
