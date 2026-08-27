import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { toggleFavorite } from "@/lib/repositories/engagement";
import { favoriteSchema } from "@/lib/server/schemas";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";

export async function POST(request: Request) {
  if (!(await isFeatureEnabled("votingEnabled"))) return NextResponse.json({ error: "Favorites are temporarily paused." }, { status: 503 });
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to save favorites." }, { status: 401 });
  const limit = await rateLimit(`favorite:${user.id}`, 40);
  if (!limit.success) return NextResponse.json({ error: "Too many favorite updates." }, { status: 429 });
  try {
    const parsed = favoriteSchema.parse(await request.json());
    const result = await toggleFavorite(user.id, parsed.productId);
    return NextResponse.json({ ok: result.ok, saved: result.saved, message: result.message }, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Invalid favorite payload." }, { status: 400 });
  }
}
