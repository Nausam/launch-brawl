import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { createOwnerProduct } from "@/lib/repositories/owner";
import { submitProductSchema } from "@/lib/server/schemas";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";

export async function POST(request: Request) {
  if (!(await isFeatureEnabled("submissionsEnabled"))) return NextResponse.json({ error: "Product submissions are temporarily paused." }, { status: 503 });
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit a product." }, { status: 401 });
  const limit = await rateLimit(`submit:${user.id}`, 5, 3_600_000);
  if (!limit.success) return NextResponse.json({ error: "Submission limit reached. Try again later." }, { status: 429 });
  try {
    const parsed = submitProductSchema.parse(await request.json());
    const product = await createOwnerProduct(user, parsed);
    return NextResponse.json({ ok: true, id: product.id, status: product.status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/persistence|Firestore/i.test(message)) return NextResponse.json({ error: "Product persistence is unavailable right now." }, { status: 503 });
    if (/slug|already listed|website/i.test(message)) return NextResponse.json({ error: message }, { status: 409 });
    return NextResponse.json({ error: "Please check the submitted fields." }, { status: 400 });
  }
}
