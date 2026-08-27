"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function OpenRoundButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const openRound = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/rounds", { method: "POST" });
      const payload = await response.json().catch(() => ({})) as { created?: boolean; error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "The sponsored round could not be opened.");
        return;
      }
      setMessage(payload.created ? "Today’s sponsored round is open." : "The sponsored round is already active.");
      router.refresh();
    } catch {
      setMessage("The round service is unavailable right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <Button type="button" onClick={openRound} disabled={busy} variant="primary" size="sm" className="uppercase tracking-[0.08em]">
        {busy ? "Opening…" : "Open today’s round"}
      </Button>
      {message && <p className="text-xs font-bold text-muted" role="status">{message}</p>}
    </div>
  );
}
