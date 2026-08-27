import Link from "next/link";
import { ArrowUpRight, Heart, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { BrawlMark } from "@/components/brand/BrawlMark";
import { ButtonLink } from "@/components/ui/Button";

const groupTones = ["bg-coral", "bg-[#d8a52b]", "bg-[#75a8cf]"] as const;

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-paper-strong/30">
      <div className="pointer-events-none absolute -left-24 top-8 h-48 w-48 rounded-full border-[22px] border-[#fff0c8]/70" />
      <div className="pointer-events-none absolute -right-36 top-0 h-80 w-80 rounded-full border-[34px] border-[#eaf3fb]/80" />

      <div className="footer-cta relative border-b border-line">
        <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
            <div>
              <div className="eyebrow flex items-center gap-2 text-coral">
                <Sparkles size={14} />
                Keep the board moving
              </div>
              <h2 className="display mt-3 max-w-2xl text-4xl font-black leading-[0.96] tracking-[-0.05em] text-ink sm:text-6xl">
                Your next good launch belongs in the mix.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">
                List it for free, let the community find it, and decide when it&apos;s time to compete for the spotlight.
              </p>
            </div>
            <ButtonLink href="/submit" variant="dark" size="md" arrow className="self-start lg:self-end">Put your launch on the board</ButtonLink>
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 py-12 lg:grid-cols-[1fr_2fr] lg:px-8 lg:py-14">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex">
            <BrawlMark />
          </Link>
          <p className="mt-5 max-w-[285px] text-sm leading-6 text-muted">
            The transparent place to discover what the internet is launching today.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 border-y border-line py-3 text-xs font-bold text-muted">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" />
            Board open · resets at midnight UTC
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
          {Object.entries(siteConfig.footerNavigation).map(([title, items], groupIndex) => (
            <div key={title}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${groupTones[groupIndex] ?? groupTones[2]}`} />
                <p className="eyebrow text-muted">{title}</p>
              </div>
              <div className="mt-5 grid gap-3">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group inline-flex items-center gap-1 text-sm text-muted transition hover:text-ink"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight size={12} className="opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© 2026 Launch Brawl. Fight fair. Build in public.</span>
          <span className="inline-flex items-center gap-2">
            <span className="hidden h-px w-8 bg-line sm:inline-block" />
            Organic discovery · Sponsored reach · Measured honestly
          </span>
          <span className="inline-flex items-center gap-1">
            Made for curious people
            <Heart size={12} className="fill-coral text-coral" />
          </span>
        </div>
      </div>
    </footer>
  );
}
