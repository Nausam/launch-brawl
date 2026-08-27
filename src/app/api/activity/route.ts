import { NextResponse } from "next/server";
import { listPublicActivity } from "@/lib/repositories/competitive";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, Math.floor(requestedLimit))) : 20;
  const before = url.searchParams.get("before") ?? undefined;
  const events = await listPublicActivity(limit, before);
  return NextResponse.json({ events, nextCursor: events.length === limit ? events.at(-1)?.createdAt : null }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } });
}
