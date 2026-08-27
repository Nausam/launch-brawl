import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { respondToRematch } from "@/lib/server/brawl-service";
import { rematchResponseSchema } from "@/lib/server/schemas";
import { clientIp } from "@/lib/server/traffic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(`brawl-rematch-response:${clientIp(request)}`, 10);
  if (!limit.success) return NextResponse.json({ error: "Too many rematch attempts. Try again soon." }, { status: 429 });
  const parsed = rematchResponseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid rematch response." }, { status: 400 });
  const { id } = await params;
  const result = await respondToRematch(id, parsed.data.action);
  return NextResponse.json(result, { status: result.ok ? 200 : result.message.startsWith("Sign in") ? 401 : result.message.includes("Only") ? 403 : 400 });
}
