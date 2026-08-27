"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SubmitProductModal } from "@/components/submit/SubmitProductModal";

type SubmitProductContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const SubmitProductContext = createContext<SubmitProductContextValue | null>(null);

export function SubmitProductProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState(0);

  const open = useCallback(() => {
    setTicket((value) => value + 1);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, close]);

  return (
    <SubmitProductContext.Provider value={value}>
      {children}
      {isOpen ? <SubmitProductModal key={ticket} onClose={close} /> : null}
    </SubmitProductContext.Provider>
  );
}

export function useSubmitProduct() {
  const context = useContext(SubmitProductContext);
  if (!context) throw new Error("useSubmitProduct must be used within SubmitProductProvider");
  return context;
}
