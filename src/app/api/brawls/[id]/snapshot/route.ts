import { NextResponse } from "next/server";
import { getBrawlById } from "@/lib/repositories/competitive";
import { getCurrentRound, getLeaderboard } from "@/lib/repositories/catalog";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brawl = await getBrawlById(id);
  if (!brawl) return NextResponse.json({ error: "Brawl not found." }, { status: 404 });
  const round = await getCurrentRound();
  const leaderboard = round ? await getLeaderboard(round) : [];
  return NextResponse.json({ brawl, sponsored: leaderboard.slice(0, 3).map((product) => ({ id: product.id, position: product.position, bidCents: product.bidCents })), round: round ? { id: round.id, status: round.status, endsAt: round.endsAt } : null }, { headers: { "Cache-Control": "no-store" } });
}
