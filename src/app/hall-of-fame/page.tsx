import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Crown, Flame, Medal, ShieldAlert, Target, Trophy } from "lucide-react";
import { getProductsByIds } from "@/lib/repositories/catalog";
import { getPlatformRecords, listRivalrySummaries } from "@/lib/repositories/competitive";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "Hall of Fame", description: "Permanent Launch Brawl records for products, people, Brawls, and seasons." };
export const dynamic = "force-dynamic";

export default async function HallOfFamePage() {
  const [records, rivalries] = await Promise.all([getPlatformRecords(), listRivalrySummaries()]);
  const productIds = [records.mostBrawlWins?.productId, records.longestWinStreak?.productId, records.highestRating?.productId, records.mostBossDefenses?.productId, ...rivalries.flatMap((rivalry) => [rivalry.productAId, rivalry.productBId])].filter((id): id is string => Boolean(id));
  const products = await getProductsByIds(productIds);
  const byId = new Map(products.map((product) => [product.id, product]));
  const recordRows = [
    { icon: <Trophy size={18} />, label: "Most Brawl wins", productId: records.mostBrawlWins?.productId, value: records.mostBrawlWins?.value },
    { icon: <Flame size={18} />, label: "Longest win streak", productId: records.longestWinStreak?.productId, value: records.longestWinStreak?.value },
    { icon: <Crown size={18} />, label: "Highest Brawl Rating", productId: records.highestRating?.productId, value: records.highestRating?.value },
    { icon: <Medal size={18} />, label: "Most Boss defenses", productId: records.mostBossDefenses?.productId, value: records.mostBossDefenses?.value },
  ];
  return <PageContainer><SectionHeading eyebrow="Permanent records" title="Hall of Fame" description="Records update from finalized, organic events and stay readable when the next season begins." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{recordRows.map((record) => <div key={record.label} className="border border-line bg-paper p-5"><span className="text-coral">{record.icon}</span><p className="mt-5 text-xs font-bold text-muted">{record.label}</p><p className="mt-1 text-lg font-black">{record.productId ? byId.get(record.productId)?.name ?? "—" : "—"}</p><p className="mt-2 text-2xl font-black text-coral">{record.value ?? "—"}</p></div>)}</div><section className="mt-12"><div className="flex items-center gap-2 border-b border-line pb-4"><ShieldAlert size={18} className="text-coral" /><h2 className="display text-3xl font-black">Signature moments</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Record label="Biggest upset" value={records.biggestUpset ? records.biggestUpset.brawlId : "—"} detail={records.biggestUpset ? `${records.biggestUpset.value} upset score` : "No eligible record yet."} /><Record label="Closest Brawl" value={records.closestBrawl?.brawlId ?? "—"} detail={records.closestBrawl ? `${records.closestBrawl.value}% final margin` : "No eligible record yet."} /><Record label="Most voted Brawl" value={records.mostVotedBrawl?.brawlId ?? "—"} detail={records.mostVotedBrawl ? `${records.mostVotedBrawl.value.toLocaleString()} valid votes` : "No eligible record yet."} /><Record label="Top Tastemaker" value={records.topTastemaker?.userId ?? "—"} detail={records.topTastemaker ? `${records.topTastemaker.value.toLocaleString()} score` : "No eligible record yet."} /></div></section><section className="mt-12"><div className="flex items-center gap-2 border-b border-line pb-4"><Target size={18} className="text-coral" /><h2 className="display text-3xl font-black">Rivalry records</h2></div><div className="mt-4 grid gap-3">{rivalries.map((rivalry) => { const a = byId.get(rivalry.productAId); const b = byId.get(rivalry.productBId); return a && b ? <Link key={rivalry.key} href={`/product/${a.slug}`} className="flex flex-wrap items-center gap-4 border-b border-line py-4"><span className="text-sm font-black">{a.name} vs {b.name}</span><span className="text-xs text-muted">{rivalry.meetings} meetings</span><span className="text-xs font-bold">{a.name} {rivalry.productAWins} — {rivalry.productBWins} {b.name}</span><span className="ml-auto text-xs font-bold text-coral">View rivalry <ArrowUpRight size={13} className="ml-1 inline" /></span></Link> : null; })}{!rivalries.length && <p className="py-8 text-center text-sm text-muted">Rivalry records appear after products meet in completed Brawls.</p>}</div></section></PageContainer>;
}

function Record({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="border border-line bg-paper-strong/55 p-5"><p className="eyebrow text-coral">{label}</p><p className="mt-3 text-sm font-black">{value}</p><p className="mt-1 text-xs text-muted">{detail}</p></div>; }
