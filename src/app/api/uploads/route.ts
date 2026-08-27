import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { createStorageUpload, verifyStorageUpload } from "@/lib/integrations/storage";
import { isMaintenanceMode } from "@/lib/server/settings";

const uploadSchema = z.object({ kind: z.enum(["logo", "cover", "avatar"]), contentType: z.string().min(3).max(80), size: z.number().int().positive().max(10 * 1024 * 1024) });
const completeSchema = uploadSchema.extend({ key: z.string().min(20).max(500) });

export async function POST(request: Request) {
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const limit = await rateLimit(`upload:${user.id}`, 20, 3_600_000);
  if (!limit.success) return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });
  const parsed = uploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  try {
    const result = await createStorageUpload({ userId: user.id, ...parsed.data });
    if (result.ok) {
      const db = getAdminDb();
      if (db) await db.collection("uploadRecords").doc(result.key.replace(/[^a-zA-Z0-9_-]/g, "_" )).set({ id: result.key, userId: user.id, kind: parsed.data.kind, contentType: parsed.data.contentType, size: parsed.data.size, publicUrl: result.publicUrl, status: "PRESIGNED", createdAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60_000) });
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ error: "Upload preparation failed." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = completeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload completion request." }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Upload persistence is unavailable." }, { status: 503 });
  const recordId = parsed.data.key.replace(/[^a-zA-Z0-9_-]/g, "_");
  const recordRef = db.collection("uploadRecords").doc(recordId);
  const record = await recordRef.get();
  if (!record.exists || String(record.data()?.userId ?? "") !== user.id || String(record.data()?.status ?? "") !== "PRESIGNED") return NextResponse.json({ error: "Upload session not found." }, { status: 404 });
  const result = await verifyStorageUpload({ userId: user.id, key: parsed.data.key, contentType: parsed.data.contentType, size: parsed.data.size });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  await recordRef.set({ status: "COMPLETED", completedAt: new Date(), updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ ok: true, publicUrl: result.publicUrl });
}
