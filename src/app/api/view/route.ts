import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { incrementProductView } from "@/lib/repositories/engagement";
import { viewSchema } from "@/lib/server/schemas";
import { recordQuestProgress } from "@/lib/server/quest-progress";
import { clientIp, isLikelyAutomatedAgent } from "@/lib/server/traffic";
import { isMaintenanceMode } from "@/lib/server/settings";

export async function POST(request: Request) {
  if (await isMaintenanceMode()) return NextResponse.json({ ok: false, recorded: false, message: "The platform is in maintenance mode." }, { status: 503 });
  if (isLikelyAutomatedAgent(request.headers.get("user-agent"))) return NextResponse.json({ ok: true, recorded: false });
  const limit = await rateLimit(`view:${clientIp(request)}`, 120);
  if (!limit.success) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  const parsed = viewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid view payload." }, { status: 400 });
  const result = await incrementProductView(parsed.data.productId, parsed.data.sessionId);
  const user = result.recorded ? await getCurrentAppUser() : null;
  if (user) await recordQuestProgress(user.id, "DISCOVER_PRODUCTS");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
