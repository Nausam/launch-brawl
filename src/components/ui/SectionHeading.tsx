import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function SectionHeading({ eyebrow, title, description, href, linkLabel = "See all" }: { eyebrow?: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div><div className="eyebrow text-coral">{eyebrow}</div><h2 className="display mt-2 max-w-2xl text-3xl font-black tracking-tight text-ink sm:text-[40px]">{title}</h2>{description && <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{description}</p>}</div>
    {href && <Link href={href} className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-bold text-ink underline decoration-coral decoration-2 underline-offset-4 sm:self-end">{linkLabel}<ArrowUpRight size={16} /></Link>}
  </div>;
}
