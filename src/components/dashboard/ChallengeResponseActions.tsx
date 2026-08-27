"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

type ResponseState = "idle" | "busy" | "accepted" | "declined";

export function ChallengeResponseActions({ challengeId, notificationId }: { challengeId: string; notificationId: string }) {
  const [state, setState] = useState<ResponseState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [brawlId, setBrawlId] = useState<string | null>(null);

  const respond = async (action: "ACCEPT" | "DECLINE") => {
    if (state === "busy" || state === "accepted" || state === "declined") return;
    setState("busy");
    setMessage(null);
    try {
      const response = await fetch(`/api/brawls/challenges/${encodeURIComponent(challengeId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json() as { ok?: boolean; id?: string; message?: string; error?: string };
      if (!response.ok || !result.ok) {
        setState("idle");
        setMessage(result.message ?? result.error ?? "The challenge could not be answered.");
        return;
      }
      setState(action === "ACCEPT" ? "accepted" : "declined");
      setBrawlId(result.id ?? null);
      setMessage(result.message ?? (action === "ACCEPT" ? "Challenge accepted." : "Challenge declined."));
      void fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, { method: "PATCH" });
    } catch {
      setState("idle");
      setMessage("The challenge service is unavailable. Try again.");
    }
  };

  if (state === "accepted") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5f4ed] px-3 py-2 text-[11px] font-black text-[#327652]"><Check size={13} />Accepted</span>
        {brawlId && <ButtonLink href={`/brawl/match/${encodeURIComponent(brawlId)}`} variant="secondary" size="xs" arrow>Open Brawl</ButtonLink>}
      </div>
    );
  }

  if (state === "declined") {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-strong px-3 py-2 text-[11px] font-black text-muted"><X size={13} />Declined</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={() => void respond("ACCEPT")} disabled={state === "busy"} variant="primary" size="xs" icon={<Check size={13} />}>{state === "busy" ? "Saving…" : "Accept"}</Button>
      <Button type="button" onClick={() => void respond("DECLINE")} disabled={state === "busy"} variant="outline" size="xs" icon={<X size={13} />}>Decline</Button>
      {message && <span className="basis-full text-[11px] font-semibold text-coral" role="status">{message}</span>}
    </div>
  );
}
