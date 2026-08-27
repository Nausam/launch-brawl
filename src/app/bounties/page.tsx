import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Crown, ShieldAlert, Swords, Trophy } from "lucide-react";
import { listBounties } from "@/lib/repositories/competitive";
import { getProductsByIds } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Pill } from "@/components/ui/Pill";

export const metadata: Metadata = { title: "Brawl Bounties", description: "Organic challenges attached to real Launch Brawl outcomes." };
export const dynamic = "force-dynamic";

export default async function BountiesPage() {
  const bounties = await listBounties("ACTIVE");
  const products = await getProductsByIds(bounties.map((bounty) => bounty.targetProductId).filter((id): id is string => Boolean(id)));
  const byId = new Map(products.map((product) => [product.id, product]));
  return <PageContainer><SectionHeading eyebrow="Organic objectives" title="Brawl Bounties" description="Optional goals that reward products for earning meaningful results in the arena. No paid entries and no guaranteed outcomes." /><div className="mt-10 grid gap-4 md:grid-cols-2">{bounties.map((bounty) => { const target = bounty.targetProductId ? byId.get(bounty.targetProductId) : undefined; return <article key={bounty.id} className="border border-line bg-paper p-6"><div className="flex items-start justify-between gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral/10 text-coral">{bounty.type === "DEFEAT_BOSS" ? <Crown size={20} /> : bounty.type === "GIANT_KILLER" ? <ShieldAlert size={20} /> : <Swords size={20} />}</div><Pill tone="coral">+{bounty.xpReward} XP</Pill></div><h2 className="display mt-6 text-2xl font-black">{bounty.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{bounty.description}</p>{target ? <Link href={`/product/${target.slug}`} className="mt-5 inline-flex items-center gap-1 text-xs font-black underline decoration-coral decoration-2 underline-offset-4">Target: {target.name}<ArrowUpRight size={13} /></Link> : <p className="mt-5 text-xs font-bold text-muted">Target is determined by the next eligible Brawl.</p>}<p className="mt-5 border-t border-line pt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Ends {new Date(bounty.endsAt).toLocaleDateString()}</p></article>; })}{!bounties.length && <div className="border border-dashed border-line p-12 text-center text-sm text-muted md:col-span-2">No active bounties are configured yet.</div>}</div><div className="mt-10 flex items-start gap-3 border border-line bg-paper-strong/45 p-5 text-xs leading-5 text-muted"><Trophy size={16} className="mt-0.5 shrink-0 text-coral" />Bounties settle from finalized Brawls and are written once by the server lifecycle job.</div></PageContainer>;
}
