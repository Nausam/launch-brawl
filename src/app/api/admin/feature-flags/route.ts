import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const featureFlagsSchema = z.object({ submissionsEnabled: z.boolean(), votingEnabled: z.boolean(), biddingEnabled: z.boolean(), campaignDeliveryEnabled: z.boolean(), brawlsEnabled: z.boolean(), challengesEnabled: z.boolean(), predictionsEnabled: z.boolean(), questsEnabled: z.boolean(), dailyPicksEnabled: z.boolean(), leaguesEnabled: z.boolean(), bossBrawlsEnabled: z.boolean(), bountiesEnabled: z.boolean() });

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  try {
    const flags = featureFlagsSchema.parse(await request.json());
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
    await db.collection("settings").doc("gamification").set({ featureFlags: flags, updatedAt: new Date(), updatedBy: user.id }, { merge: true });
    await recordAdminAuditLog({ actorId: user.id, action: "FEATURE_FLAGS_UPDATED", entityType: "settings", entityId: "gamification", requestId: requestId(request) });
    return NextResponse.json({ ok: true, mode: "firestore", message: "Feature switches saved." });
  } catch {
    return NextResponse.json({ error: "Invalid feature flag payload." }, { status: 400 });
  }
}
