"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ClaimReviewActions({ productId, claimId }: { productId: string; claimId: string }) {
  const [busy, setBusy] = useState(false);
  const decide = async (action: "APPROVE" | "REJECT") => { setBusy(true); const response = await fetch(`/api/admin/products/${productId}/claim`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, claimId }) }); setBusy(false); if (response.ok) window.location.reload(); };
  return <div className="flex gap-2"><Button type="button" onClick={() => void decide("APPROVE")} disabled={busy} variant="primary" size="xs">Approve</Button><Button type="button" onClick={() => void decide("REJECT")} disabled={busy} variant="outline" size="xs">Reject</Button></div>;
}
