"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function RefundBidButton({ bidId, status, freemiusLicenseId }: { bidId: string; status: string; freemiusLicenseId?: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!freemiusLicenseId || !["ACTIVE", "PAID"].includes(status)) return null;
  const refund = async () => {
    if (busy || !window.confirm("Record a Freemius refund request for this bid? You will complete the refund in Freemius Payments.")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/bids/${encodeURIComponent(bidId)}/refund`, { method: "POST" });
      const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
      setMessage(payload.message ?? payload.error ?? "Refund requested.");
    } catch {
      setMessage("Refund service unavailable.");
    } finally {
      setBusy(false);
    }
  };
  return <div className="flex items-center gap-2"><Button type="button" onClick={() => void refund()} disabled={busy} variant="coral-outline" size="xs">{busy ? "Recording…" : "Refund"}</Button>{message && <span className="text-[11px] text-muted">{message}</span>}</div>;
}
