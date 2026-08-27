import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { archiveOwnerProduct, updateOwnerProduct } from "@/lib/repositories/owner";
import { updateProductSchema } from "@/lib/server/schemas";
import { isFeatureEnabled, isMaintenanceMode } from "@/lib/server/settings";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isFeatureEnabled("submissionsEnabled"))) return NextResponse.json({ error: "Product editing is temporarily paused." }, { status: 503 });
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const limit = await rateLimit(`product-edit:${user.id}`, 30, 60 * 60 * 1000);
  if (!limit.success) return NextResponse.json({ error: "Too many product updates. Try again later." }, { status: 429 });
  const parsed = updateProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product update." }, { status: 400 });
  try {
    const { id } = await params;
    const product = await updateOwnerProduct(user, id, parsed.data);
    return NextResponse.json({ ok: true, product: { id: product.id, slug: product.slug, status: product.status } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product.";
    return NextResponse.json({ error: message }, { status: message === "Product not found." ? 404 : message.includes("own") ? 403 : 409 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isFeatureEnabled("submissionsEnabled"))) return NextResponse.json({ error: "Product editing is temporarily paused." }, { status: 503 });
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const limit = await rateLimit(`product-edit:${user.id}`, 30, 60 * 60 * 1000);
  if (!limit.success) return NextResponse.json({ error: "Too many product updates. Try again later." }, { status: 429 });
  try {
    const { id } = await params;
    await archiveOwnerProduct(user, id);
    return NextResponse.json({ ok: true, status: "ARCHIVED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to archive product.";
    return NextResponse.json({ error: message }, { status: message === "Product not found." ? 404 : message.includes("own") ? 403 : 409 });
  }
}
