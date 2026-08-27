import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { listProductMembers, inviteProductMember, respondToProductInvitation, updateProductMember, transferProductOwnership } from "@/lib/repositories/owner";
import { findProductById } from "@/lib/repositories/catalog";
import { isMaintenanceMode } from "@/lib/server/settings";
import { rateLimit } from "@/lib/integrations/rate-limit";

const inviteSchema = z.object({ identifier: z.string().trim().min(1).max(160), role: z.enum(["EDITOR", "VIEWER"]) });
const updateSchema = z.object({ action: z.enum(["ACCEPT", "DECLINE"]).optional(), memberUserId: z.string().min(1).max(120).optional(), role: z.enum(["EDITOR", "VIEWER", "REMOVED"]).optional(), transferToUserId: z.string().min(1).max(120).optional() }).refine((value) => Boolean(value.action || value.memberUserId || value.transferToUserId), "A member action is required.");

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  const product = await findProductById(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const members = await listProductMembers(id);
  if (user.role !== "ADMIN" && product.ownerId !== user.id && !members.some((member) => member.userId === user.id && member.status === "ACTIVE")) return NextResponse.json({ error: "Product team access required." }, { status: 403 });
  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const limit = await rateLimit(`product-members:${user.id}`, 20, 3_600_000);
  if (!limit.success) return NextResponse.json({ error: "Member management rate limit reached." }, { status: 429 });
  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid member invitation." }, { status: 400 });
  try {
    const { id } = await params;
    return NextResponse.json({ ok: true, member: await inviteProductMember(user, id, parsed.data.identifier, parsed.data.role) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The invitation could not be created." }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const limit = await rateLimit(`product-members:${user.id}`, 20, 3_600_000);
  if (!limit.success) return NextResponse.json({ error: "Member management rate limit reached." }, { status: 429 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid member update." }, { status: 400 });
  try {
    const { id } = await params;
    if (parsed.data.action) return NextResponse.json(await respondToProductInvitation(user, id, parsed.data.action));
    if (parsed.data.transferToUserId) return NextResponse.json(await transferProductOwnership(user, id, parsed.data.transferToUserId));
    return NextResponse.json(await updateProductMember(user, id, parsed.data.memberUserId!, parsed.data.role!));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The member update could not be saved." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (await isMaintenanceMode()) return NextResponse.json({ error: "The platform is in maintenance mode." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const limit = await rateLimit(`product-members:${user.id}`, 20, 3_600_000);
  if (!limit.success) return NextResponse.json({ error: "Member management rate limit reached." }, { status: 429 });
  const parsed = z.object({ memberUserId: z.string().min(1).max(120) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Member ID is required." }, { status: 400 });
  try {
    const { id } = await params;
    return NextResponse.json(await updateProductMember(user, id, parsed.data.memberUserId, "REMOVED"));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The member could not be removed." }, { status: 400 });
  }
}
