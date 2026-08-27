"use client";

import { ArrowUpRight, ChevronDown, Gavel, Megaphone, ShieldCheck, Swords, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { calculateCampaignImpressions, cn, formatMoney } from "@/lib/utils";
import { supportedFreemiusBidOptions } from "@/lib/bidding-pricing";
import { Button } from "@/components/ui/Button";

type BidButtonVariant = "default" | "gold" | "bronze" | "blue";
type BidButtonSize = "default" | "compact";

function bidTriggerStyle(variant: BidButtonVariant, size: BidButtonSize): {
  button: string;
  tile: string;
  icon: ReactNode;
  arrowSize: number;
} {
  const compact = size === "compact";
  const sizeClasses = compact ? "h-10 min-w-0 rounded-[14px] rounded-br-[6px] px-3 text-[10px]" : "h-11 min-w-[136px] rounded-[16px] rounded-br-[7px] px-4 text-xs sm:text-sm";
  const tile = compact ? "h-5 w-5 rounded-[8px] rounded-br-[4px]" : "h-7 w-7 rounded-[9px] rounded-br-[4px]";
  const iconSize = compact ? 15 : 16;
  const arrowSize = compact ? 12 : 13;

  switch (variant) {
    case "gold":
      return {
        button: `group inline-flex ${sizeClasses} w-full items-center justify-center gap-2 whitespace-nowrap border border-[#e1c579] bg-[#fff3c6] font-black uppercase tracking-[0.06em] text-[#8f6414] shadow-[2px_2px_0_#e1c579] transition hover:-translate-y-0.5 hover:border-[#d5ad45] hover:bg-[#ffedb0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d28f13]`,
        tile: cn("grid shrink-0 place-items-center border border-[#8f6414]/20 bg-[#8f6414]/10 transition group-hover:bg-[#8f6414]/20", tile),
        icon: <ShieldCheck size={iconSize} />,
        arrowSize,
      };
    case "blue":
      return {
        button: `group inline-flex ${sizeClasses} w-full items-center justify-center gap-2 whitespace-nowrap border border-[#b3cfe5] bg-[#eaf4fc] font-black uppercase tracking-[0.06em] text-[#2c6794] shadow-[2px_2px_0_#b3cfe5] transition hover:-translate-y-0.5 hover:border-[#8fb9da] hover:bg-[#e0effa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168fe0]`,
        tile: cn("grid shrink-0 place-items-center border border-[#2c6794]/20 bg-[#2c6794]/10 transition group-hover:bg-[#2c6794]/20", tile),
        icon: <Swords size={iconSize} />,
        arrowSize,
      };
    case "bronze":
      return {
        button: `group inline-flex ${sizeClasses} w-full items-center justify-center gap-2 whitespace-nowrap border border-[#e2b68e] bg-[#fff0df] font-black uppercase tracking-[0.06em] text-[#a56132] shadow-[2px_2px_0_#e2b68e] transition hover:-translate-y-0.5 hover:border-[#d39968] hover:bg-[#ffe7d0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c87b43]`,
        tile: cn("grid shrink-0 place-items-center border border-[#a56132]/20 bg-[#a56132]/10 transition group-hover:bg-[#a56132]/20", tile),
        icon: <Trophy size={iconSize} />,
        arrowSize,
      };
    case "default":
      return compact
        ? {
            button: `group inline-flex ${sizeClasses} w-full items-center justify-center gap-2 whitespace-nowrap border border-coral-dark bg-coral font-black uppercase tracking-[0.08em] text-white shadow-[2px_2px_0_#d95135] transition hover:-translate-y-0.5 hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral`,
            tile: cn("grid shrink-0 place-items-center border border-white/30 bg-white/15 text-white transition group-hover:bg-white group-hover:text-coral", tile),
            icon: <Gavel size={iconSize} />,
            arrowSize,
          }
        : {
            button: "group inline-flex h-11 min-w-[160px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-[16px] rounded-br-[7px] border border-ink bg-ink px-4 text-xs font-black uppercase tracking-[0.06em] text-white shadow-[2px_2px_0_#14212b] transition hover:-translate-y-0.5 hover:bg-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral",
            tile: "grid h-7 w-7 shrink-0 place-items-center rounded-[9px] rounded-br-[4px] border border-white/20 bg-white/10 transition group-hover:bg-white/20",
            icon: null,
            arrowSize: 13,
          };
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

type BidPackageOption = {
  quota: number;
  amountCents: number;
};

function BidAmountPicker({
  options,
  value,
  onChange,
}: {
  options: BidPackageOption[];
  value: number;
  onChange: (amountCents: number) => void;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.amountCents === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex] ?? options[0];

  const updateMenuBox = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuBox({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    updateMenuBox();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    window.addEventListener("resize", updateMenuBox);
    window.addEventListener("scroll", updateMenuBox, true);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("resize", updateMenuBox);
      window.removeEventListener("scroll", updateMenuBox, true);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, selectedIndex, updateMenuBox]);

  useEffect(() => {
    if (!open || !menuBox) return;
    menuRef.current?.focus();
  }, [menuBox, open]);

  useEffect(() => {
    if (!open) return;
    const option = menuRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    if (option instanceof HTMLElement) option.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!selected) return null;

  const selectAt = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.amountCents);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveActive = (delta: number) => {
    setActiveIndex((current) => Math.min(options.length - 1, Math.max(0, current + delta)));
  };

  return (
    <div className="mt-6">
      <p className="eyebrow text-muted" id={`${listId}-label`}>Sponsored bid amount · USD</p>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label ${listId}-value`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          setOpen(true);
        }}
        className="mt-2 flex w-full items-center gap-4 rounded-[17px] rounded-br-[8px] border border-line bg-white px-4 py-3 text-left shadow-[2px_2px_0_#e5e2da] transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]">
          <Gavel size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-muted">Selected package</span>
          <span id={`${listId}-value`} className="mt-0.5 block text-2xl font-black tracking-[-0.04em] text-ink">{formatMoney(selected.amountCents)}</span>
          <span className="mt-0.5 block text-xs font-bold text-muted">{calculateCampaignImpressions(selected.amountCents).toLocaleString()} impressions</span>
        </span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-line bg-paper text-ink">
          <ChevronDown size={18} className={cn("transition", open && "rotate-180")} />
        </span>
      </button>
      {open && menuBox
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-label="Sponsored bid amount"
              aria-activedescendant={`${listId}-option-${activeIndex}`}
              style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveActive(1);
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveActive(-1);
                  return;
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  setActiveIndex(0);
                  return;
                }
                if (event.key === "End") {
                  event.preventDefault();
                  setActiveIndex(options.length - 1);
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectAt(activeIndex);
                }
              }}
              className="fixed z-[90] overflow-hidden rounded-[17px] rounded-br-[8px] border border-line bg-white p-1.5 shadow-[2px_2px_0_#e5e2da] focus:outline-none"
            >
              <div className="max-h-56 overflow-y-auto">
                {options.map((option, index) => {
                  const checked = option.amountCents === value;
                  const active = index === activeIndex;
                  return (
                    <button
                      key={option.quota}
                      id={`${listId}-option-${index}`}
                      data-index={index}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      tabIndex={-1}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectAt(index)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[12px] rounded-br-[5px] px-3 py-2.5 text-left text-sm font-black transition",
                        checked ? "bg-coral/10 text-coral" : "text-ink hover:bg-paper",
                        active && !checked && "bg-paper",
                      )}
                    >
                      <span>{formatMoney(option.amountCents)}</span>
                      <span className="text-xs font-bold text-muted">{calculateCampaignImpressions(option.amountCents).toLocaleString()} imp.</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function BidDialog({
  productId,
  productName,
  currentBidCents,
  roundId,
  buttonLabel = "Take the lead",
  buttonVariant = "default",
  buttonSize = "default",
}: {
  productId: string;
  productName: string;
  currentBidCents: number;
  roundId: string;
  buttonLabel?: string;
  buttonVariant?: "default" | "gold" | "bronze" | "blue";
  buttonSize?: "default" | "compact";
}) {
  const router = useRouter();
  const titleId = useId();
  const options = supportedFreemiusBidOptions(currentBidCents);
  const firstOption = options[0];
  const [open, setOpen] = useState(false);
  const [amountCents, setAmountCents] = useState<number>(firstOption?.amountCents ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [queued, setQueued] = useState(false);
  const impressionEstimate = calculateCampaignImpressions(amountCents);
  const trigger = bidTriggerStyle(buttonVariant, buttonSize);

  const close = useCallback(() => {
    setOpen(false);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [close, open]);

  const checkout = async () => {
    setBusy(true);
    setError("");
    const response = await fetch("/api/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        roundId,
        amountCents,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.status === 401) {
      router.push("/sign-in");
      return;
    }
    if (typeof payload.checkoutUrl === "string" && payload.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }
    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : typeof payload.message === "string" ? payload.message : "Could not start checkout.");
      return;
    }
    setQueued(true);
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setOpen(true);
          setQueued(false);
          setError("");
        }}
        unstyled
        className={trigger.button}
      >
        {trigger.icon}
        <span>{buttonLabel}</span>
        <span className={trigger.tile}>
          <ArrowUpRight size={trigger.arrowSize} />
        </span>
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#14212b]/55 p-0 sm:items-center sm:p-6 animate-submit-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <Button variant="backdrop" unstyled onClick={close} aria-label="Close bid dialog" />
          <div className="relative flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden border-t border-line bg-paper shadow-[0_-18px_60px_rgba(20,33,43,.28)] animate-submit-panel sm:max-h-[92vh] sm:rounded-[28px] sm:rounded-br-[12px] sm:border sm:shadow-[0_28px_80px_rgba(20,33,43,.28)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden sm:rounded-[28px] sm:rounded-br-[12px]" aria-hidden>
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-coral/5" />
              <div className="noise absolute inset-0 opacity-30" />
            </div>
            <Button onClick={close} variant="icon" size="icon" icon={<X size={18} />} className="absolute right-3 top-3 z-20 h-10 w-10 rounded-[12px] rounded-br-[5px] border-line bg-paper/90 shadow-[2px_2px_0_#e5e2da] sm:right-4 sm:top-4" aria-label="Close" />
            <div className="relative overflow-y-auto px-6 py-7 pr-16 sm:px-8 sm:py-8">
              <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral">The daily brawl</div>
              <h2 id={titleId} className="display mt-4 max-w-2xl text-3xl font-black leading-[.95] tracking-[-0.05em] sm:text-4xl">Take #1 for {productName}</h2>
              {queued ? (
                <div className="mt-6 rounded-[17px] rounded-br-[8px] border border-[#a7dacc] bg-[linear-gradient(180deg,#f3fbf8,#d9efe9)] p-6 shadow-[2px_2px_0_#a7dacc]">
                  <span className="grid h-12 w-12 place-items-center rounded-[12px] rounded-br-[5px] border border-[#2d7667] bg-[#2d7667] text-white">
                    <Gavel size={20} />
                  </span>
                  <p className="mt-4 text-sm font-black text-[#245c42]">Bid is ready for this account</p>
                  <p className="mt-2 text-sm leading-6 text-[#2d7667]">Freemius checkout is not configured, so the bid was not charged or activated. Add the Freemius production credentials to complete payment.</p>
                  <Button onClick={close} variant="dark" size="sm" className="mt-5 shrink-0 whitespace-nowrap">Back to leaderboard</Button>
                </div>
              ) : (
                <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(17rem,.8fr)] md:items-start">
                  <div>
                    <p className="max-w-lg text-sm leading-6 text-muted">Highest active bid leads. Your payment also creates a promotional campaign, so getting outbid changes position—not the exposure you purchased.</p>
                    {options.length ? (
                      <BidAmountPicker options={options} value={amountCents} onChange={setAmountCents} />
                    ) : (
                      <p className="mt-6 text-sm font-bold text-coral">No supported package is large enough to beat the current bid.</p>
                    )}
                    {firstOption ? (
                      <p className="mt-3 text-xs leading-5 text-muted">
                        Packages start at <span className="font-black text-ink">{formatMoney(firstOption.amountCents)}</span>
                        {currentBidCents > 0 ? <> · current lead is <span className="font-black text-ink">{formatMoney(currentBidCents)}</span></> : " · this takes the open #1 slot."}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:sticky md:top-0">
                    <div className="flex items-start gap-3 rounded-[17px] rounded-br-[8px] border border-line bg-white p-4 shadow-[2px_2px_0_#e5e2da]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-coral/30 bg-coral/10 text-coral">
                        <Megaphone size={15} />
                      </span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Promo allocation</p>
                        <p className="mt-1 text-sm font-black text-ink">{impressionEstimate.toLocaleString()} impressions</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-[17px] rounded-br-[8px] border border-line bg-white p-4 shadow-[2px_2px_0_#e5e2da]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]">
                        <Trophy size={15} />
                      </span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Board spot</p>
                        <p className="mt-1 text-sm font-black text-ink">#1 while this bid leads</p>
                      </div>
                    </div>
                    {error ? <p className="text-sm font-bold text-coral" role="alert">{error}</p> : null}
                    <Button
                      type="button"
                      onClick={checkout}
                      disabled={busy || !amountCents}
                      variant="primary"
                      size="lg"
                      arrow
                      className="h-12 w-full shrink-0 whitespace-nowrap"
                    >
                      {busy ? "Starting checkout…" : "Continue to secure checkout"}
                    </Button>
                    <p className="text-[11px] leading-5 text-muted">Signed-in bids go through Freemius hosted checkout. Your placement activates after verified payment confirmation; delayed callbacks are reconciled automatically.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
