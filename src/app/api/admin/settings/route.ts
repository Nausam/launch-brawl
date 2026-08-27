import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { requestId } from "@/lib/server/request";

const schema = z.object({
  minimumBidCents: z.number().int().min(1).max(10_000_000),
  minimumIncrementCents: z.number().int().min(1).max(10_000_000),
  maximumBidCents: z.number().int().min(1).max(100_000_000),
  promoImpressionsPerDollar: z.number().int().min(1).max(10_000),
  biddingPaused: z.boolean(),
  newCampaignsPaused: z.boolean(),
  gamificationConfigVersion: z.number().int().positive().max(1000).optional(),
  biddingConfigVersion: z.number().int().positive().max(1000).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(240).optional(),
}).refine((value) => value.maximumBidCents >= value.minimumBidCents, { message: "Maximum bid must be at least the minimum bid." });

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid platform settings." }, { status: 400 });
  await db.collection("settings").doc("platform").set({ ...parsed.data, updatedAt: new Date(), updatedBy: admin.id }, { merge: true });
  await recordAdminAuditLog({ actorId: admin.id, action: "PLATFORM_SETTINGS_UPDATED", entityType: "settings", entityId: "platform", requestId: requestId(request) });
  return NextResponse.json({ ok: true, message: "Platform settings saved." });
}
