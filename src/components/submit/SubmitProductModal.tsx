"use client";

import { X } from "lucide-react";
import { SubmitProductFlow } from "@/components/submit/SubmitProductFlow";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function SubmitProductModal({ onClose, categories }: { onClose: () => void; categories?: Category[] }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#14212b]/55 p-0 sm:items-center sm:p-6 animate-submit-backdrop" role="dialog" aria-modal="true" aria-labelledby="submit-product-title">
      <Button variant="backdrop" unstyled onClick={onClose} aria-label="Close submit dialog" />
      <div className="relative flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden border-t border-line bg-paper shadow-[0_-18px_60px_rgba(20,33,43,.28)] animate-submit-panel sm:max-h-[92vh] sm:rounded-[28px] sm:rounded-br-[12px] sm:border sm:border-line sm:shadow-[0_28px_80px_rgba(20,33,43,.28)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden sm:rounded-[28px] sm:rounded-br-[12px]" aria-hidden>
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-coral/5" />
          <div className="noise absolute inset-0 opacity-30" />
        </div>
        <Button onClick={onClose} variant="icon" size="icon" icon={<X size={18} />} className="absolute right-3 top-3 z-10 h-10 w-10 rounded-[12px] rounded-br-[5px] border-line bg-paper/90 shadow-[2px_2px_0_#e5e2da] sm:right-4 sm:top-4" aria-label="Close" />
        <SubmitProductFlow variant="modal" onClose={onClose} initialCategories={categories} />
      </div>
    </div>
  );
}
