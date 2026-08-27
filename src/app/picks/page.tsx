import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { getUserDailyPicks } from "@/lib/repositories/competitive";
import { listPublishedProducts } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DailyPicksForm } from "@/components/gamification/DailyPicksForm";

export const metadata: Metadata = { title: "Daily Picks", description: "Choose three products for an organic, non-monetary daily scorecard." };
export const dynamic = "force-dynamic";

export default async function PicksPage() {
  const [user, products] = await Promise.all([getCurrentAppUser(), listPublishedProducts(60)]);
  const picks = user ? await getUserDailyPicks(user.id) : [];
  const today = picks.find((pick) => pick.date === new Date().toISOString().slice(0, 10));
  return <PageContainer><SectionHeading eyebrow="Purely for the signal" title="Today's Picks" description="Choose three products you think will perform well today. This is community gamification—not gambling, wagering, or a paid entry." /><section className="mt-10 border-2 border-ink bg-ink p-6 text-white sm:p-8"><div className="flex items-start justify-between gap-4"><div><div className="eyebrow text-white/50">My Picks</div><h2 className="display mt-2 text-3xl font-black">Build your scorecard</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Points come from organic Brawl wins, trending movement, and valid community engagement. Sponsored leaderboard position never counts.</p></div><Trophy className="text-coral" size={24} /></div><div className="mt-7">{user ? <DailyPicksForm products={products.slice(0, 12)} initialPicks={today?.productIds ?? []} /> : <p className="text-sm text-white/70">Sign in to save Daily Picks across devices. <Link href="/sign-in" className="font-bold text-white underline decoration-coral">Sign in</Link></p>}</div></section><section className="mt-10 grid gap-4 md:grid-cols-3"><Metric label="Today's score" value={today?.score !== undefined ? String(today.score) : "—"} detail="settles after the day closes" /><Metric label="Global rank" value={today?.rank !== undefined ? `#${today.rank}` : "—"} detail="among participating users" /><Metric label="Best pick" value="—" detail="earned after real settlement" /></section><section className="mt-10"><div className="eyebrow text-coral">History</div><h2 className="display mt-2 text-3xl font-black">Your recent picks</h2>{picks.length ? <div className="mt-4 grid gap-3">{picks.map((pick) => <div key={pick.id} className="flex flex-wrap items-center gap-4 border-b border-line py-4"><span className="text-sm font-black">{pick.date}</span><span className="text-xs text-muted">{pick.productIds.map((id) => products.find((product) => product.id === id)?.name).filter(Boolean).join(" · ") || "Products no longer public"}</span><span className="ml-auto text-sm font-black">{pick.score !== undefined ? `${pick.score} pts` : "Pending"}</span>{pick.rank !== undefined && <span className="text-xs font-bold text-coral">#{pick.rank}</span>}</div>)}</div> : <p className="mt-4 border border-dashed border-line p-8 text-center text-sm text-muted">No saved Daily Picks yet.</p>}</section></PageContainer>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="border border-line bg-paper p-5"><p className="eyebrow text-muted">{label}</p><p className="display mt-2 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-muted">{detail}</p></div>; }
