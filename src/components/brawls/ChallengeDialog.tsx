"use client";

import { useId, useState } from "react";
import { Swords, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SubmitProductButton } from "@/components/submit/SubmitProductButton";

type ChallengerOption = Pick<Product, "id" | "name" | "status">;

const fieldClass = "w-full rounded-[16px] rounded-br-[7px] border border-line bg-white px-4 py-3 text-sm font-bold text-ink shadow-[2px_2px_0_#e5e2da] outline-none transition focus:border-ink";

export function ChallengeDialog({
  challengedProductId,
  challengedProductName,
  challengerProducts,
  signedIn,
}: {
  challengedProductId: string;
  challengedProductName: string;
  challengerProducts: ChallengerOption[];
  signedIn: boolean;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const candidates = challengerProducts.filter((product) => product.id !== challengedProductId && product.status === "PUBLISHED");
  const [challengerProductId, setChallengerProductId] = useState(candidates[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setOpen(false);
    setError("");
    setSent(false);
    setBusy(false);
  };

  const submit = async () => {
    if (!challengerProductId || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/brawls/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengerProductId, challengedProductId, message: message.trim() || undefined }),
      });
      const result = await response.json() as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || result.ok === false) {
        setError(result.error ?? result.message ?? "The challenge could not be sent.");
        return;
      }
      setSent(true);
    } catch {
      setError("The challenge service is unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button type="button" variant="primary" size="md" icon={<Swords size={16} />} onClick={() => setOpen(true)}>
        Challenge
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#14212b]/55 p-0 sm:items-center sm:p-6 animate-submit-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <Button variant="backdrop" unstyled onClick={close} aria-label="Close challenge dialog" />
          <div className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border-t border-line bg-paper shadow-[0_-18px_60px_rgba(20,33,43,.28)] animate-submit-panel sm:max-h-[92vh] sm:rounded-[28px] sm:rounded-br-[12px] sm:border sm:shadow-[0_28px_80px_rgba(20,33,43,.28)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden sm:rounded-[28px] sm:rounded-br-[12px]" aria-hidden>
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-coral/5" />
              <div className="noise absolute inset-0 opacity-30" />
            </div>
            <Button onClick={close} variant="icon" size="icon" icon={<X size={18} />} className="absolute right-3 top-3 z-20 h-10 w-10 rounded-[12px] rounded-br-[5px] border-line bg-paper/90 shadow-[2px_2px_0_#e5e2da] sm:right-4 sm:top-4" aria-label="Close" />
            <div className="relative overflow-y-auto px-6 py-7 pr-16 sm:px-8 sm:py-8">
              <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral">
                Challenge
                <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                  <Swords size={13} />
                </span>
              </div>
              <h2 id={titleId} className="display mt-4 max-w-xl text-3xl font-black leading-[.95] tracking-[-0.05em] sm:text-4xl">
                Invite {challengedProductName.trim()} into the arena.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">Choose a published product you own, add an optional note, and send the invite. Acceptance creates a new organic Brawl.</p>
              {sent ? (
                <div className="mt-6 rounded-[17px] rounded-br-[8px] border border-[#a7dacc] bg-[linear-gradient(180deg,#f3fbf8,#d9efe9)] p-6 shadow-[2px_2px_0_#a7dacc]">
                  <span className="grid h-12 w-12 place-items-center rounded-[12px] rounded-br-[5px] border border-[#2d7667] bg-[#2d7667] text-white">
                    <Swords size={20} />
                  </span>
                  <p className="mt-4 text-sm font-black text-[#245c42]">Challenge sent.</p>
                  <p className="mt-2 text-sm leading-6 text-[#2d7667]">The owner gets the invite. If they accept, the matchup lands on the organic tape.</p>
                  <Button onClick={close} variant="dark" size="sm" className="mt-5">Back to the exhibit</Button>
                </div>
              ) : !signedIn ? (
                <div className="mt-6 rounded-[17px] rounded-br-[8px] border border-line bg-white p-6 shadow-[2px_2px_0_#e5e2da]">
                  <p className="text-sm font-black text-ink">Sign in to send a challenge.</p>
                  <p className="mt-2 text-sm leading-6 text-muted">Challenges have to come from a published product you own.</p>
                  <ButtonLink href="/sign-in" variant="primary" size="sm" arrow className="mt-5">
                    Sign in
                  </ButtonLink>
                </div>
              ) : !candidates.length ? (
                <div className="mt-6 rounded-[17px] rounded-br-[8px] border border-dashed border-line bg-paper p-6">
                  <p className="text-sm font-black text-ink">Publish a product you own first.</p>
                  <p className="mt-2 text-sm leading-6 text-muted">A challenge needs a live listing on your side of the tape.</p>
                  <SubmitProductButton variant="primary" size="sm" arrow className="mt-5" onOpen={close}>
                    Add a product
                  </SubmitProductButton>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Your launch</span>
                    <select value={challengerProductId} onChange={(event) => setChallengerProductId(event.target.value)} className={fieldClass}>
                      {candidates.map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Note</span>
                    <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={280} placeholder="Optional challenge message" className={`${fieldClass} font-medium`} />
                  </label>
                  {error ? <p className="text-sm font-bold text-coral" role="alert">{error}</p> : null}
                  <Button type="button" onClick={() => void submit()} disabled={busy || !challengerProductId} variant="primary" size="md" icon={<Swords size={16} />}>
                    {busy ? "Sending…" : "Send challenge"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
