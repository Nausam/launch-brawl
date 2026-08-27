import { Archive, Award } from "lucide-react";
import { listDailyWinners } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WinnerBadge } from "@/components/winners/WinnerBadge";

export const metadata = { title: "Winner archive" };

export default async function WinnersPage() { const winners = await listDailyWinners(); return <PageContainer><SectionHeading eyebrow="Permanent record" title="The winner archive" description="Every 24-hour brawl leaves a record. Winner pages and badges link back to the verified round." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{winners.map((winner, index) => <WinnerBadge key={winner.id} name={winner.productName} date={winner.date} bidCents={winner.winningBidCents} winnerId={winner.id} dark={index === 0} />)}</div>{!winners.length && <p className="mt-10 border border-dashed border-line p-10 text-center text-sm text-muted">No sponsored rounds have been finalized yet.</p>}<div className="mt-10 grid gap-3 border border-line bg-paper-strong/55 p-5 sm:grid-cols-2 sm:p-6"><div className="flex gap-3"><Archive size={19} className="mt-0.5 text-coral" /><div><p className="text-sm font-bold">A lasting win</p><p className="mt-1 text-xs leading-5 text-muted">Winner status is recorded when a round finalizes. It is never backfilled from a screenshot.</p></div></div><div className="flex gap-3"><Award size={19} className="mt-0.5 text-coral" /><div><p className="text-sm font-bold">Shareable proof</p><p className="mt-1 text-xs leading-5 text-muted">Product owners can download a badge or embed it on their own site.</p></div></div></div></PageContainer>; }
