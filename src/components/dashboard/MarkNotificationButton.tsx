"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function MarkNotificationButton({ notificationId }: { notificationId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (done) return <span className="text-[11px] font-bold text-[#3E8E65]">Read</span>;
  return <Button type="button" disabled={busy} onClick={async () => { setBusy(true); const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, { method: "PATCH" }); if (response.ok) setDone(true); setBusy(false); }} variant="ghost" size="xs" className="px-0 text-[11px] font-bold text-coral">{busy ? "Saving…" : "Mark read"}</Button>;
}
