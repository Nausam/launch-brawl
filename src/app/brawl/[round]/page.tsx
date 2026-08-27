import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProductById } from "@/lib/repositories/catalog";
import { getBrawlById, getBrawlReport, getProductCompetitiveStats } from "@/lib/repositories/competitive";
import { BrawlDetailPageView } from "@/components/brawls/BrawlDetailPage";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ round: string }> }): Promise<Metadata> {
  const { round } = await params;
  const brawl = await getBrawlById(round);
  const [left, right] = brawl ? await Promise.all([findProductById(brawl.productAId ?? brawl.leftProductId), findProductById(brawl.productBId ?? brawl.rightProductId)]) : [];
  return { title: left && right ? `${left.name} vs ${right.name}` : "Brawl" };
}

export default async function BrawlDetailPage({ params }: { params: Promise<{ round: string }> }) {
  const { round } = await params;
  const brawl = await getBrawlById(round);
  if (!brawl) notFound();
  const [left, right, leftStats, rightStats, report] = await Promise.all([
    findProductById(brawl.productAId ?? brawl.leftProductId),
    findProductById(brawl.productBId ?? brawl.rightProductId),
    getProductCompetitiveStats(brawl.productAId ?? brawl.leftProductId),
    getProductCompetitiveStats(brawl.productBId ?? brawl.rightProductId),
    getBrawlReport(brawl.id),
  ]);
  if (!left || !right) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": "Event", name: `${left.name} vs ${right.name}`, startDate: brawl.startsAt, endDate: brawl.endsAt, eventStatus: brawl.status === "COMPLETED" ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled", location: { "@type": "VirtualLocation", url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/brawl/${brawl.id}` } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><BrawlDetailPageView brawl={brawl} left={left} right={right} leftStats={leftStats} rightStats={rightStats} report={report} /></>;
}
