"use client";

import { Bookmark, Heart, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCompact } from "@/lib/utils";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { bumpLiveCount, useLiveCount } from "@/components/products/product-engagement";

export type ActionButtonVariant = "ghost" | "plaque";

const stampShell = "group inline-flex shrink-0 items-center justify-center gap-1.5 font-black transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 disabled:cursor-not-allowed";
const likeStamp = "border border-coral-dark bg-coral text-white shadow-[2px_2px_0_#d95135] hover:bg-coral-dark";
const saveStamp = "border border-[#203c52] bg-navy text-white shadow-[2px_2px_0_#14212b] hover:bg-ink";

async function mutate(path: string, productId: string) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

function ActionGlyph({ icon: Icon, active, size }: { icon: LucideIcon; active: boolean; size: number }) {
  return <Icon size={size} strokeWidth={2.4} fill={active ? "currentColor" : "none"} />;
}

function voteChrome(variant: ActionButtonVariant, voted: boolean) {
  switch (variant) {
    case "ghost":
      return voted
        ? { unstyled: true, className: `${stampShell} ${likeStamp} min-h-8 rounded-[12px] rounded-br-[5px] px-2 text-[11px]`, iconSize: 13 }
        : { unstyled: false, buttonVariant: "ghost" as ButtonVariant, size: "xs" as ButtonSize, className: "px-1.5 font-bold", iconSize: 13 };
    case "plaque":
      return voted
        ? { unstyled: true, className: `${stampShell} ${likeStamp} min-h-10 min-w-11 rounded-[14px] rounded-br-[6px] px-3 text-xs`, iconSize: 15 }
        : { unstyled: false, buttonVariant: "outline" as ButtonVariant, size: "sm" as ButtonSize, className: "min-w-11 px-3 border-ink/15 bg-white/80 text-ink hover:border-ink", iconSize: 15 };
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

function favoriteChrome(variant: ActionButtonVariant, saved: boolean) {
  switch (variant) {
    case "ghost":
      return saved
        ? { unstyled: true, className: `${stampShell} ${saveStamp} h-9 w-9 rounded-[12px] rounded-br-[5px] p-0`, iconSize: 16 }
        : { unstyled: false, buttonVariant: "icon" as ButtonVariant, className: "h-9 w-9 border-transparent bg-transparent", iconSize: 16 };
    case "plaque":
      return saved
        ? { unstyled: true, className: `${stampShell} ${saveStamp} h-10 w-10 rounded-[12px] rounded-br-[5px] p-0`, iconSize: 16 }
        : { unstyled: false, buttonVariant: "icon" as ButtonVariant, className: "h-10 w-10 rounded-[12px] rounded-br-[5px] border-ink/15 bg-white/80 text-ink hover:border-ink", iconSize: 16 };
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

export function VoteButton({
  productId,
  initialVotes,
  initialVoted = false,
  buttonVariant = "ghost",
}: {
  productId: string;
  initialVotes: number;
  initialVoted?: boolean;
  buttonVariant?: ActionButtonVariant;
}) {
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [pending, setPending] = useState(false);
  const votes = useLiveCount("votes", productId, initialVotes);
  const chrome = voteChrome(buttonVariant, voted);
  const vote = async () => {
    if (pending || voted) return;
    setPending(true);
    setVoted(true);
    bumpLiveCount("votes", productId, initialVotes, 1);
    const result = await mutate("/api/vote", productId);
    if (result.status === 401) {
      setVoted(false);
      bumpLiveCount("votes", productId, initialVotes, -1);
      router.push("/sign-in");
    } else if (result.payload.alreadyVoted) {
      setVoted(true);
    } else if (!result.ok) {
      setVoted(false);
      bumpLiveCount("votes", productId, initialVotes, -1);
    }
    setPending(false);
  };
  return (
    <Button
      onClick={() => void vote()}
      aria-busy={pending}
      unstyled={chrome.unstyled}
      variant={chrome.unstyled ? undefined : chrome.buttonVariant}
      size={chrome.unstyled ? undefined : chrome.size}
      icon={<ActionGlyph icon={Heart} active={voted} size={chrome.iconSize} />}
      aria-label={voted ? "Vote recorded" : "Vote for product"}
      aria-pressed={voted}
      className={chrome.className}
    >
      {formatCompact(votes)}
    </Button>
  );
}

export function FavoriteButton({
  productId,
  initialFavorites = 0,
  initialSaved = false,
  buttonVariant = "ghost",
}: {
  productId: string;
  initialFavorites?: number;
  initialSaved?: boolean;
  buttonVariant?: ActionButtonVariant;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const chrome = favoriteChrome(buttonVariant, saved);
  const toggle = async () => {
    if (pending) return;
    setPending(true);
    const next = !saved;
    const delta = next ? 1 : -1;
    setSaved(next);
    bumpLiveCount("favorites", productId, initialFavorites, delta);
    const result = await mutate("/api/favorites", productId);
    if (result.status === 401) {
      setSaved(!next);
      bumpLiveCount("favorites", productId, initialFavorites, -delta);
      router.push("/sign-in");
    } else if (!result.ok) {
      setSaved(!next);
      bumpLiveCount("favorites", productId, initialFavorites, -delta);
    } else if (typeof result.payload.saved === "boolean" && result.payload.saved !== next) {
      setSaved(result.payload.saved);
      bumpLiveCount("favorites", productId, initialFavorites, -delta);
    }
    setPending(false);
  };
  return (
    <Button
      onClick={() => void toggle()}
      aria-busy={pending}
      unstyled={chrome.unstyled}
      variant={chrome.unstyled ? undefined : chrome.buttonVariant}
      size="icon"
      icon={<ActionGlyph icon={Bookmark} active={saved} size={chrome.iconSize} />}
      aria-label={saved ? "Remove favorite" : "Favorite product"}
      aria-pressed={saved}
      className={chrome.className}
    />
  );
}
