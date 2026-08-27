import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { findProductById } from "@/lib/repositories/catalog";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { dailyPicksSchema } from "@/lib/server/schemas";
import { recordQuestProgress } from "@/lib/server/quest-progress";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";

export async function POST(request: Request) {
  if (!(await isFeatureEnabled("dailyPicksEnabled"))) return NextResponse.json({ error: "Daily Picks are temporarily paused." }, { status: 503 });
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to lock in Daily Picks." }, { status: 401 });
  const limit = await rateLimit(`daily-picks:${user.id}`, 5, 86_400_000);
  if (!limit.success) return NextResponse.json({ error: "Daily Picks are already submitted for this account." }, { status: 429 });
  try {
    const { productIds } = dailyPicksSchema.parse(await request.json());
    const products = await Promise.all(productIds.map((id) => findProductById(id)));
    if (new Set(productIds).size !== productIds.length || products.some((product) => !product || product.status !== "PUBLISHED")) {
      return NextResponse.json({ error: "Choose three different published products." }, { status: 400 });
    }
    const date = new Date().toISOString().slice(0, 10);
    const id = `${date}_${user.id}`;
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Daily Picks are unavailable until Firestore is configured." }, { status: 503 });
    await db.collection("dailyPicks").doc(id).create({ id, date, userId: user.id, productIds, submittedAt: new Date() });
    await recordQuestProgress(user.id, "DAILY_PICKS");
    return NextResponse.json({ ok: true, id, message: "Today's picks are locked in." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid Daily Picks payload." }, { status: 400 });
  }
}
