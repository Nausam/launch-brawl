import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, saveAppUserProfile } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { optionalPublicHttpUrl } from "@/lib/server/schemas";
import { isMaintenanceMode } from "@/lib/server/settings";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  username: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/i),
  website: z.union([z.literal(""), optionalPublicHttpUrl]),
  bio: z.string().trim().max(400).optional(),
  imageUrl: optionalPublicHttpUrl,
  notificationPreferences: z.object({
    email: z.boolean(),
    productActivity: z.boolean(),
    competitive: z.boolean(),
    campaigns: z.boolean(),
  }).optional(),
});

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ role: user.role });
}

export async function PATCH(request: Request) {
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const limit = await rateLimit(`account:${user.id}`, 20, 60 * 60 * 1000);
  if (!limit.success) return NextResponse.json({ error: "Too many account updates. Try again later." }, { status: 429 });
  try {
    const parsed = profileSchema.parse(await request.json());
    await saveAppUserProfile(user.id, parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/persistence|Firestore/i.test(message)) return NextResponse.json({ error: "Account persistence is unavailable right now." }, { status: 503 });
    if (/username/i.test(message)) return NextResponse.json({ error: message }, { status: 409 });
    return NextResponse.json({ error: "Check the profile fields and try again." }, { status: 400 });
  }
}
