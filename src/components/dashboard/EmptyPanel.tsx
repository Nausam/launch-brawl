import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";

export function EmptyPanel({ title, body, href, action, actionSlot }: { title: string; body: string; href?: string; action?: string; actionSlot?: ReactNode }) {
  return (
    <div className="rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper-strong/45 px-6 py-10 text-center">
      <p className="text-sm font-black text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{body}</p>
      {actionSlot ? (
        <div className="mt-5">{actionSlot}</div>
      ) : href && action ? (
        <ButtonLink href={href} variant="primary" size="sm" arrow className="mt-5 uppercase tracking-[0.08em]">{action}</ButtonLink>
      ) : null}
    </div>
  );
}
