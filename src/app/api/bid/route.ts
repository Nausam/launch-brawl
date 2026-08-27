import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { findProductById } from "@/lib/repositories/catalog";
import { createFreemiusCheckout, freemiusIsConfigured, freemiusPlanId } from "@/lib/integrations/freemius";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { bidSchema } from "@/lib/server/schemas";
import { loadBidContext, validateBid } from "@/lib/server/bidding";
import { findPendingFreemiusCheckout, freemiusPendingBidId, markFreemiusCheckoutFailed, recordPendingFreemiusCheckout } from "@/lib/repositories/payments";
import { getAdminDb } from "@/lib/firebase/admin";
import { publicAppUrl } from "@/lib/server/runtime";
import { isFeatureEnabled } from "@/lib/server/settings";

export async function POST(request: Request) {
  if (!(await isFeatureEnabled("biddingEnabled"))) return NextResponse.json({ error: "Sponsored bidding is not enabled yet." }, { status: 503 });
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Sign in to place a bid." }, { status: 401 });
  const limit = await rateLimit(`bid:${user.id}`, 10);
  if (!limit.success) return NextResponse.json({ error: "Too many bid attempts. Try again soon." }, { status: 429 });
  try {
    const parsed = bidSchema.parse(await request.json());
    const [product, context] = await Promise.all([findProductById(parsed.productId), loadBidContext()]);
    if (context.settings.maintenanceMode) return NextResponse.json({ error: context.settings.maintenanceMessage }, { status: 503 });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (product.status !== "PUBLISHED") return NextResponse.json({ error: "Only published products can be placed on the sponsored board." }, { status: 409 });
    if (!context.round) return NextResponse.json({ error: "There is no active sponsored round right now." }, { status: 409 });
    if (product.ownerId !== user.id && user.role !== "ADMIN") return NextResponse.json({ error: "Only the product owner can bid this listing onto the board." }, { status: 403 });
    if (parsed.roundId !== context.round.id) return NextResponse.json({ error: "This brawl round is no longer active." }, { status: 400 });
    const validation = validateBid({ amountCents: parsed.amountCents, currentHighestCents: context.round.winningBidCents ?? 0, round: context.round, settings: context.settings });
    if (!validation.valid) return NextResponse.json({ error: validation.reason }, { status: 400 });
    if (!freemiusIsConfigured()) return NextResponse.json({ ok: false, checkoutUrl: null, message: "Freemius checkout is not configured, so this bid was not activated." }, { status: 503 });
    if (!user.email) return NextResponse.json({ error: "Your account needs an email address before checkout can start." }, { status: 409 });
    if (!getAdminDb()) return NextResponse.json({ error: "Firestore is not configured, so this bid cannot be safely recorded." }, { status: 503 });
    const appUrl = publicAppUrl();
    if (!appUrl) return NextResponse.json({ error: "The application URL is not configured." }, { status: 503 });
    const bidId = freemiusPendingBidId(user.id, context.round.id, product.id);
    const existingPending = await findPendingFreemiusCheckout(user.id, bidId);
    if (existingPending) return NextResponse.json({ error: "Finish your existing Freemius checkout before starting another bid." }, { status: 409 });
    const quota = validation.quota;
    if (!quota) return NextResponse.json({ error: "This bid does not match a supported Freemius package." }, { status: 400 });
    await recordPendingFreemiusCheckout({ bidId, productId: product.id, roundId: context.round.id, ownerId: user.id, ownerEmail: user.email, amountCents: parsed.amountCents, quota, planId: freemiusPlanId() });
    try {
      const checkoutUrl = await createFreemiusCheckout({
        email: user.email,
        name: user.displayName,
        quota,
        cancelUrl: `${appUrl}/dashboard/products?checkout=cancelled`,
      });
      if (!checkoutUrl) {
        await markFreemiusCheckoutFailed(bidId, "Freemius checkout could not be created.");
        return NextResponse.json({ ok: false, checkoutUrl: null, message: "Freemius checkout is not configured, so this bid was not activated." }, { status: 503 });
      }
      return NextResponse.json({ ok: true, mode: "freemius", checkoutUrl });
    } catch (error) {
      await markFreemiusCheckoutFailed(bidId, "Freemius checkout could not be created.");
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/Firestore|configured/i.test(message)) return NextResponse.json({ error: "Bid persistence is unavailable right now." }, { status: 503 });
    return NextResponse.json({ error: "Unable to prepare this bid." }, { status: 400 });
  }
}
