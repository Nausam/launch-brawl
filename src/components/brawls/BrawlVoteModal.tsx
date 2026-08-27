"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Flame, Sparkles, Swords, X, Zap } from "lucide-react";
import type { Brawl, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductLogo } from "@/components/products/ProductLogo";
import { Button } from "@/components/ui/Button";

type VoteSide = "left" | "right";

type BrawlVoteModalProps = {
  open: boolean;
  onClose: () => void;
  brawl: Brawl;
  left: Product;
  right: Product;
  initialVoteChoice?: VoteSide | null;
  hasVoted?: boolean;
  hasPrediction?: boolean;
  onVoteCounted?: (side: VoteSide) => void;
  onPredictionSaved?: () => void;
};

type ServiceResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  alreadyVoted?: boolean;
};

export function BrawlVoteModal({
  open,
  onClose,
  brawl,
  left,
  right,
  initialVoteChoice = null,
  hasVoted = false,
  hasPrediction = false,
  onVoteCounted,
  onPredictionSaved,
}: BrawlVoteModalProps) {
  const [voteChoice, setVoteChoice] = useState<VoteSide | null>(initialVoteChoice);
  const [predictionChoice, setPredictionChoice] = useState<VoteSide | null>(null);
  const [voteLocked, setVoteLocked] = useState(hasVoted);
  const [predictionLocked, setPredictionLocked] = useState(hasPrediction);
  const [voteBusy, setVoteBusy] = useState(false);
  const [predictionBusy, setPredictionBusy] = useState(false);
  const [voteStatus, setVoteStatus] = useState<string | null>(null);
  const [predictionStatus, setPredictionStatus] = useState<string | null>(null);
  const live = brawl.status === "LIVE";

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  const submitVote = async () => {
    if (!voteChoice || voteBusy || voteLocked || !live) return;
    setVoteBusy(true);
    setVoteStatus(null);
    try {
      const selectedProductId = voteChoice === "left" ? left.id : right.id;
      const response = await fetch("/api/brawls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brawlId: brawl.id, selectedProductId }),
      });
      const result = await response.json() as ServiceResponse;
      if (!response.ok || !result.ok) {
        if (result.alreadyVoted) setVoteLocked(true);
        setVoteStatus(result.message ?? result.error ?? "Vote was not counted.");
        return;
      }
      setVoteLocked(true);
      setVoteStatus(result.message ?? "Vote counted. +2 XP awarded once.");
      onVoteCounted?.(voteChoice);
    } catch {
      setVoteStatus("The Brawl service is unavailable. Try again.");
    } finally {
      setVoteBusy(false);
    }
  };

  const savePrediction = async () => {
    if (!predictionChoice || predictionBusy || predictionLocked || !live) return;
    setPredictionBusy(true);
    setPredictionStatus(null);
    try {
      const predictedProductId = predictionChoice === "left" ? left.id : right.id;
      const response = await fetch("/api/brawls/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brawlId: brawl.id, predictedProductId }),
      });
      const result = await response.json() as ServiceResponse;
      if (!response.ok || !result.ok) {
        if (result.message?.toLowerCase().includes("already made")) setPredictionLocked(true);
        setPredictionStatus(result.message ?? result.error ?? "Prediction was not saved.");
        return;
      }
      setPredictionLocked(true);
      setPredictionStatus(result.message ?? "Prediction locked in.");
      onPredictionSaved?.();
    } catch {
      setPredictionStatus("The prediction service is unavailable. Try again.");
    } finally {
      setPredictionBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`brawl-vote-modal-${brawl.id}`}
        className="relative mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-[18px] rounded-br-[8px] border border-line bg-paper text-ink sm:my-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-5 border-b border-line px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] bg-coral text-white"><Swords size={17} /></span>
            <div>
              <div className="eyebrow text-coral">Brawl board · make your call</div>
              <h2 id={`brawl-vote-modal-${brawl.id}`} className="display mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Vote and predict.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Choose the launch you want to move forward, then make a separate call on who will finish ahead.</p>
            </div>
          </div>
          <Button type="button" variant="icon" size="icon" icon={<X size={17} />} aria-label="Close vote and prediction dialog" onClick={onClose} className="h-9 w-9 shrink-0" />
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:gap-5 sm:p-8">
          <section className="rounded-[16px] rounded-br-[7px] border border-line bg-paper-strong/35 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted"><span className="grid h-7 w-7 place-items-center rounded-[9px] rounded-br-[4px] bg-coral/10 text-coral"><Check size={14} /></span>Community vote</div>
            <h3 className="display mt-5 text-2xl font-black tracking-[-0.035em]">Pick a side.</h3>
            <p className="mt-2 min-h-10 text-xs leading-5 text-muted">Your vote moves the live split and earns +2 XP once.</p>
            <div className="mt-5 grid gap-2">
              <ModalChoice product={left} side="left" label="Challenger" selected={voteChoice === "left"} disabled={!live || voteLocked} onClick={() => setVoteChoice("left")} />
              <ModalChoice product={right} side="right" label="Defender" selected={voteChoice === "right"} disabled={!live || voteLocked} onClick={() => setVoteChoice("right")} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button type="button" variant="dark" size="sm" disabled={!voteChoice || voteBusy || voteLocked || !live} onClick={() => void submitVote()}>{voteBusy ? "Counting…" : voteLocked ? "Vote counted" : live ? "Lock vote" : "Voting closed"}<Zap size={14} />{!voteLocked && live && "+2 XP"}</Button>
              {voteStatus && <p className="text-[11px] font-bold text-muted" role="status">{voteStatus}</p>}
            </div>
          </section>

          <section className="rounded-[16px] rounded-br-[7px] border border-line bg-paper-strong/35 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted"><span className="grid h-7 w-7 place-items-center rounded-[9px] rounded-br-[4px] bg-[#7c5cdb]/10 text-[#7c5cdb]"><Sparkles size={14} /></span>Your prediction</div>
            <h3 className="display mt-5 text-2xl font-black tracking-[-0.035em]">Call the finish.</h3>
            <p className="mt-2 min-h-10 text-xs leading-5 text-muted">Prediction is separate from voting and closes before the final stretch.</p>
            <div className="mt-5 grid gap-2">
              <ModalChoice product={left} side="left" label="Predict challenger" selected={predictionChoice === "left"} disabled={!live || predictionLocked} onClick={() => setPredictionChoice("left")} tone="violet" />
              <ModalChoice product={right} side="right" label="Predict defender" selected={predictionChoice === "right"} disabled={!live || predictionLocked} onClick={() => setPredictionChoice("right")} tone="violet" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button type="button" variant="violet" size="sm" disabled={!predictionChoice || predictionBusy || predictionLocked || !live} onClick={() => void savePrediction()}>{predictionBusy ? "Saving…" : predictionLocked ? "Prediction saved" : live ? "Save prediction" : "Predictions closed"}<Flame size={14} /></Button>
              {predictionStatus && <p className="text-[11px] font-bold text-muted" role="status">{predictionStatus}</p>}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper-strong/25 px-5 py-4 sm:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-muted"><Clock3 size={14} className={live ? "text-coral" : "text-[#7c5cdb]"} />{live ? "Board closes tomorrow" : "This Brawl is no longer live"}</div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

function ModalChoice({ product, side, label, selected, disabled, onClick, tone = "coral" }: { product: Product; side: VoteSide; label: string; selected: boolean; disabled: boolean; onClick: () => void; tone?: "coral" | "violet" }) {
  return (
    <Button
      type="button"
      unstyled
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex min-h-[76px] w-full items-center gap-3 rounded-[14px] rounded-br-[6px] border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55",
        selected
          ? tone === "violet" ? "border-[#7c5cdb] bg-[#7c5cdb]/10" : "border-coral bg-coral/10"
          : "border-line bg-paper hover:border-ink/30 hover:bg-paper",
      )}
    >
      <ProductLogo product={product} size="sm" className="shrink-0 border-0 shadow-none" />
      <span className="min-w-0 flex-1">
        <span className={cn("eyebrow", side === "left" ? "text-[#c27c1a]" : "text-[#5d86a8]")}>{label}</span>
        <span className="mt-1 block truncate text-sm font-black text-ink">{product.name}</span>
      </span>
      {selected && <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-[8px] rounded-br-[4px] text-white", tone === "violet" ? "bg-[#7c5cdb]" : "bg-coral")}><Check size={13} /></span>}
    </Button>
  );
}
