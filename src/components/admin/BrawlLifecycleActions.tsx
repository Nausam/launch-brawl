"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function BrawlLifecycleActions({ brawlId, status }: { brawlId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const act = async (action: "CANCEL" | "FEATURE" | "INVESTIGATE") => {
    if (action === "CANCEL" && !window.confirm("Cancel this Brawl?")) return;
    setBusy(true);
    const response = await fetch(`/api/admin/brawls/${brawlId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? `${action.toLowerCase()}d.` : result.error ?? "Action failed.");
    if (response.ok) router.refresh();
    setBusy(false);
  };
  if (status === "COMPLETED" || status === "CANCELLED") return <span className="text-[11px] text-muted">{message}</span>;
  return <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="xs" disabled={busy} onClick={() => void act("FEATURE")}>Feature</Button><Button type="button" variant="outline" size="xs" disabled={busy} onClick={() => void act("INVESTIGATE")}>Investigate</Button><Button type="button" variant="outline" size="xs" disabled={busy} onClick={() => void act("CANCEL")}>Cancel</Button>{message && <span className="text-[11px] text-muted">{message}</span>}</div>;
}
