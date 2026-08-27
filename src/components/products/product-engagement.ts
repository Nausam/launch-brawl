"use client";

import { useSyncExternalStore } from "react";
import { formatCompact } from "@/lib/utils";

export type EngagementKind = "votes" | "favorites";

const counts: Record<EngagementKind, Map<string, number>> = {
  votes: new Map(),
  favorites: new Map(),
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribeLiveCounts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readLiveCount(kind: EngagementKind, productId: string, initial: number) {
  return counts[kind].get(productId) ?? initial;
}

export function bumpLiveCount(kind: EngagementKind, productId: string, initial: number, delta: number) {
  const current = counts[kind].get(productId) ?? initial;
  counts[kind].set(productId, Math.max(0, current + delta));
  emit();
}

export function useLiveCount(kind: EngagementKind, productId: string, initial: number) {
  return useSyncExternalStore(subscribeLiveCounts, () => readLiveCount(kind, productId, initial), () => initial);
}

export function LiveCount({ kind, productId, initial }: { kind: EngagementKind; productId: string; initial: number }) {
  return formatCompact(useLiveCount(kind, productId, initial));
}
