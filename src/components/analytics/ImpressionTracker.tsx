"use client";

import { useEffect, useRef } from "react";

function getSessionId() {
  const key = "launchbrawl-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = `s_${crypto.randomUUID()}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

export function ImpressionTracker({ campaignId, productId, placement, page, trackingToken }: { campaignId: string; productId: string; placement: string; page: string; trackingToken: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const sent = useRef(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || sent.current || !("IntersectionObserver" in window)) return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        timer = window.setTimeout(() => {
          if (sent.current) return;
          sent.current = true;
          void fetch("/api/impression", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId, productId, placement, page, trackingToken, sessionId: getSessionId() }) });
          observer.disconnect();
        }, 1000);
      } else if (timer) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    }, { threshold: [0.5] });
    observer.observe(element);
    return () => { if (timer) window.clearTimeout(timer); observer.disconnect(); };
  }, [campaignId, page, placement, productId, trackingToken]);
  return <span ref={ref} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-px w-px" />;
}
