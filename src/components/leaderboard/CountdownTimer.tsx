"use client";

import { useEffect, useState } from "react";

const getRemaining = (endsAt: string) => Math.max(0, new Date(endsAt).getTime() - Date.now());
const format = (ms: number) => { const seconds = Math.floor(ms / 1000); const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const rest = seconds % 60; return [hours, minutes, rest].map((part) => String(part).padStart(2, "0")).join(":"); };

export function CountdownTimer({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));
  useEffect(() => { const timer = window.setInterval(() => setRemaining(getRemaining(endsAt)), 1000); return () => window.clearInterval(timer); }, [endsAt]);
  return <span suppressHydrationWarning className={compact ? "font-mono text-xs font-bold tabular-nums" : "font-mono text-sm font-bold tabular-nums text-ink"}>{format(remaining)}</span>;
}
