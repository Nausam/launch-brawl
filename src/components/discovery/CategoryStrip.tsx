import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <div className="relative border-y border-line bg-paper-strong/20">
      <div className="scrollbar-hide flex items-center gap-6 overflow-x-auto py-4">
        <div className="w-[150px] shrink-0 border-r border-line pr-5">
          <div className="eyebrow text-coral">Find your corner</div>
          <p className="mt-2 text-xs leading-5 text-muted">Follow a signal you care about.</p>
        </div>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          aria-label={`Explore ${category.name} launches`}
          className="group relative flex min-w-[160px] items-center gap-3 border-b-2 border-transparent bg-paper/40 px-2.5 py-2.5 transition hover:border-line hover:bg-paper"
        >
          <span
            aria-hidden="true"
            className="h-9 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: category.accent }}
          />
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[17px] text-white"
            style={{ backgroundColor: category.accent }}
          >
            {category.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold leading-4 tracking-[-0.01em] text-ink group-hover:text-coral">
              {category.name}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold leading-4 text-muted transition group-hover:text-coral">
              Explore <ArrowUpRight size={11} strokeWidth={2.5} />
            </span>
          </span>
        </Link>
      ))}
      </div>
    </div>
  );
}
