"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareProductButton({ name, url }: { name: string; url: string }) {
  const [shared, setShared] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${name} — Launch Brawl`, text: `See ${name} on Launch Brawl.`, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2200);
    } catch {
      // A dismissed native share sheet is not an error worth surfacing.
    }
  };
  return <Button type="button" variant="icon" size="icon" icon={shared ? <Check size={16} /> : <Share2 size={16} />} aria-label={shared ? "Product link copied" : "Share product"} onClick={() => void share()} />;
}
