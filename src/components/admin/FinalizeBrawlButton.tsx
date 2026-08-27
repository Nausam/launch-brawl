"use client";

import { useState } from "react";
import { Gavel } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FinalizeBrawlButton({ brawlId }: { brawlId: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const finalize = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/brawls/${brawlId}/finalize`, { method: "POST" });
      const result = await response.json() as { message?: string; error?: string };
      setStatus(result.message ?? result.error ?? "Finalized.");
    } catch { setStatus("Admin service unavailable."); } finally { setBusy(false); }
  };
  return <span className="inline-flex items-center gap-2"><Button type="button" onClick={finalize} disabled={busy} variant="outline" size="xs" icon={<Gavel size={12} />}>{busy ? "Working…" : "Force finalize"}</Button>{status && <span className="max-w-[180px] text-[10px] font-bold text-muted" role="status">{status}</span>}</span>;
}
