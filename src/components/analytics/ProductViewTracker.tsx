"use client";

import { useEffect } from "react";

function getSessionId() {
  const key = "launchbrawl-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = `s_${crypto.randomUUID()}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    void fetch("/api/view", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, sessionId: getSessionId() }) });
  }, [productId]);
  return null;
}
