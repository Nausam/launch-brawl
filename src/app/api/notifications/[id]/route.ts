import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const limit = await rateLimit(`notification-read:${user.id}`, 120, 60 * 60 * 1000);
  if (!limit.success) return NextResponse.json({ error: "Too many notification updates. Try again later." }, { status: 429 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Notifications are unavailable until Firestore is configured." }, { status: 503 });
  const { id } = await params;
  const ref = db.collection("notifications").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  if (snapshot.data()?.userId !== user.id) return NextResponse.json({ error: "Notification ownership check failed." }, { status: 403 });
  await ref.update({ read: true, readAt: new Date() });
  return NextResponse.json({ ok: true });
}
