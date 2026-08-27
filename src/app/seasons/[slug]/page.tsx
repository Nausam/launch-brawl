import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { getProductsByIds } from "@/lib/repositories/catalog";
import { getLeagueStandings, getSeasonBySlug } from "@/lib/repositories/competitive";
import { PageContainer } from "@/components/layout/PageContainer";
import { Pill } from "@/components/ui/Pill";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const season = await getSeasonBySlug(slug); return { title: season?.name ?? "Season" }; }

export default async function SeasonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const season = await getSeasonBySlug(slug);
  if (!season) notFound();
  const standings = await getLeagueStandings();
  const products = await getProductsByIds(standings.map((standing) => standing.productId));
  const byId = new Map(products.map((product) => [product.id, product]));
  const champion = season.championProductId ? byId.get(season.championProductId) : undefined;
  return <PageContainer><Link href="/seasons" className="inline-flex items-center gap-2 text-xs font-bold text-muted"><ArrowLeft size={14} />All seasons</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-7"><div><div className="eyebrow text-coral">{season.status} · organic competition</div><h1 className="display mt-3 text-5xl font-black sm:text-7xl">{season.name}</h1><p className="mt-3 text-sm leading-6 text-muted">Points are earned by organic Brawl results. Sponsored leaderboard position is never included.</p></div>{season.current ? <Pill tone="coral">Live now</Pill> : <Pill tone="mint">Archived</Pill>}</div>{champion && <section className="mt-8 flex items-center gap-4 border border-line bg-butter p-5"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-coral">🏆</span><div><div className="eyebrow text-muted">Season champion</div><p className="mt-1 text-lg font-black">{champion.name}</p></div><Link href={`/product/${champion.slug}`} className="ml-auto inline-flex items-center gap-1 text-xs font-bold underline decoration-coral decoration-2 underline-offset-4">View product <ArrowUpRight size={13} /></Link></section>}<section className="mt-10"><div className="border-b border-line pb-4"><div className="eyebrow text-coral">Standings</div><h2 className="display mt-2 text-3xl font-black">The race</h2></div>{standings.length ? <div className="mt-4 grid gap-2">{standings.map((standing) => { const product = byId.get(standing.productId); if (!product) return null; return <Link key={standing.id} href={`/product/${product.slug}`} className="grid gap-3 border border-line bg-paper px-4 py-4 hover:border-coral sm:grid-cols-[54px_1fr_100px_100px_90px_90px] sm:items-center"><span className="display text-2xl font-black">#{standing.rank}</span><span><span className="block text-sm font-black">{product.name}</span><span className="mt-1 block text-xs text-muted">{standing.wins}-{standing.losses}-{standing.draws} · {standing.division}</span></span><span className="text-sm font-black">{standing.points} <span className="text-[10px] text-muted">points</span></span><span className="text-sm font-black">{standing.ratingCurrent}</span><span className="text-xs font-bold">{standing.winRate}% win rate</span><span className="inline-flex items-center gap-1 text-xs font-bold text-muted">{standing.movement > 0 ? <TrendingUp size={13} className="text-[#3E8E65]" /> : standing.movement < 0 ? <TrendingDown size={13} className="text-coral" /> : null}{Math.abs(standing.movement)}</span></Link>; })}</div> : <p className="mt-4 border border-dashed border-line p-10 text-center text-sm text-muted">No completed Brawls have contributed to this season yet.</p>}</section></PageContainer>;
}

