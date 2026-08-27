import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { requestRematch } from "@/lib/server/brawl-service";
import { rematchSchema } from "@/lib/server/schemas";
import { clientIp } from "@/lib/server/traffic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(`brawl-rematch:${clientIp(request)}`, 5, 3_600_000);
  if (!limit.success) return NextResponse.json({ error: "Rematch limit reached. Try again later." }, { status: 429 });
  const { id } = await params;
  try {
    const payload = rematchSchema.parse(await request.json());
    const result = await requestRematch(id, payload.message);
    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch {
    return NextResponse.json({ error: "Invalid rematch payload." }, { status: 400 });
  }
}
