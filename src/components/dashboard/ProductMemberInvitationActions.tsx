"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ProductMemberInvitationActions({ productId }: { productId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const respond = async (action: "ACCEPT" | "DECLINE") => {
    setBusy(true);
    const response = await fetch(`/api/products/${productId}/members`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? (action === "ACCEPT" ? "Invitation accepted." : "Invitation declined.") : payload.error ?? "The invitation could not be updated.");
    setBusy(false);
  };
  return <div className="mt-4 flex flex-wrap items-center gap-2"><Button type="button" disabled={busy} onClick={() => void respond("ACCEPT")} variant="primary" size="xs">Accept</Button><Button type="button" disabled={busy} onClick={() => void respond("DECLINE")} variant="outline" size="xs">Decline</Button>{message ? <span className="text-xs font-bold text-muted" role="status">{message}</span> : null}</div>;
}
