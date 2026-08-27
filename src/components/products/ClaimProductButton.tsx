"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ClaimProductButton({ productId }: { productId: string }) {
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const response = await fetch(`/api/products/${productId}/claim`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidence }) });
    const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
    setMessage(response.ok ? payload.message ?? "Claim submitted for review." : payload.error ?? "The claim could not be submitted.");
    setBusy(false);
  };
  return (
    <div className="mt-5 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-4 py-4 sm:px-5">
      <p className="text-xs leading-5 text-muted">Are you the maker? Submit evidence for admin ownership review.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Proof or company email (optional)" className="min-w-0 flex-1 rounded-[14px] rounded-br-[6px] border border-line bg-white px-3 py-2 text-xs outline-none focus:border-ink" />
        <Button type="button" variant="outline" size="xs" disabled={busy} onClick={() => void submit()}>{busy ? "Sending…" : "Claim listing"}</Button>
      </div>
      {message ? <p className="mt-2 text-xs font-bold text-muted" role="status">{message}</p> : null}
    </div>
  );
}
