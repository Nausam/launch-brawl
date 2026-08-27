"use client";

import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductLogo } from "@/components/products/ProductLogo";
import { Pill } from "@/components/ui/Pill";
import type { Category } from "@/lib/types";

export function SearchExperience({ products, categories, initialQuery = "" }: { products: Product[]; categories: Category[]; initialQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(() => { const value = query.toLowerCase().trim(); if (!value) return products.slice(0, 8); return products.filter((product) => `${product.name} ${product.shortDescription} ${product.fullDescription} ${product.tags.join(" ")} ${product.makerName} ${categories.find((category) => category.id === product.categoryId)?.name ?? product.categoryId}`.toLowerCase().includes(value)); }, [categories, products, query]);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const value = query.trim();
      if (value) params.set("q", value);
      else params.delete("q");
      const next = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      if (`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}` !== next) router.replace(next, { scroll: false });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [pathname, query, router, searchParams]);
  return <div><div className="relative max-w-2xl"><Search className="absolute left-4 top-4 text-muted" size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, categories, or ideas" className="w-full border border-ink bg-paper px-12 py-4 text-base outline-none placeholder:text-muted/70" /></div><p className="mt-4 text-xs text-muted">{query ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Start with the latest launches"}</p><div className="mt-8 border-y border-line">{results.map((product) => <Link key={product.id} href={`/product/${product.slug}`} className="group flex items-center gap-4 border-b border-line px-3 py-4 last:border-0 hover:bg-paper-strong/50"><ProductLogo product={product} size="sm" /><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="font-bold group-hover:text-coral">{product.name}</span><Pill>{categories.find((category) => category.id === product.categoryId)?.name ?? product.categoryId}</Pill></span><span className="mt-1 block truncate text-sm text-muted">{product.shortDescription}</span></span><ArrowUpRight size={16} className="text-muted group-hover:text-coral" /></Link>)}{!results.length && <div className="p-12 text-center text-sm text-muted">No products match that search yet.</div>}</div></div>;
}
