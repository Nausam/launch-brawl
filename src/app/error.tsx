"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("launchbrawl_route_error", { message: error.message, digest: error.digest });
  }, [error]);
  return <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-16"><p className="eyebrow text-coral">Signal interrupted</p><h1 className="display mt-4 text-5xl font-black">This page needs another pass.</h1><p className="mt-5 text-sm leading-6 text-muted">The page could not load completely. Try again, or return to the Launch Brawl home.</p><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => reset()} className="bg-ink px-5 py-3 text-sm font-bold text-white">Try again</button><Link href="/" className="border border-line px-5 py-3 text-sm font-bold">Go home</Link></div></main>;
}
