"use client";

import { SubmitPageHint, SubmitProductFlow } from "@/components/submit/SubmitProductFlow";
import type { Category } from "@/lib/types";

export function SubmitForm({ categories }: { categories?: Category[] }) {
  return (
    <div>
      <SubmitProductFlow variant="page" initialCategories={categories} />
      <SubmitPageHint />
    </div>
  );
}
