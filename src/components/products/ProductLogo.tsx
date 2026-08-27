"use client";

import { useState } from "react";
import { cn, initials, productIconCandidates } from "@/lib/utils";
import type { Product } from "@/lib/types";

const sizes = {
  sm: "h-9 w-9 rounded-[10px] text-xs",
  md: "h-12 w-12 rounded-[13px] text-sm",
  lg: "h-16 w-16 rounded-[18px] text-lg",
  xl: "h-20 w-20 rounded-[22px] text-xl",
} as const;

type ProductLogoSource = Pick<Product, "name" | "color"> & Partial<Pick<Product, "logoUrl" | "websiteUrl">>;

export function ProductLogo({
  product,
  size = "md",
  className,
}: {
  product: ProductLogoSource;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const candidates = productIconCandidates(product);
  const [failedCount, setFailedCount] = useState(0);
  const src = candidates[failedCount];

  return (
    <span
      className={cn(
        "noise inline-flex shrink-0 items-center justify-center overflow-hidden bg-paper-strong font-black text-white shadow-[inset_0_0_0_1px_rgba(20,33,43,.07)]",
        sizes[size],
        className,
      )}
      style={src ? undefined : { backgroundColor: product.color }}
      aria-label={`${product.name} logo`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedCount((count) => count + 1)}
        />
      ) : (
        initials(product.name)
      )}
    </span>
  );
}
