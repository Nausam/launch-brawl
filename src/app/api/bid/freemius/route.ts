import { NextResponse } from "next/server";
import { getFreemius } from "@/lib/integrations/freemius";
import { activateFreemiusPurchase } from "@/lib/repositories/payments";
import { publicAppUrl } from "@/lib/server/runtime";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const freemius = getFreemius();
  if (!freemius) return NextResponse.json({ error: "Freemius checkout is not configured." }, { status: 503 });
  try {
    const redirectInfo = await freemius.checkout.processRedirect(request.url);
    const appUrl = publicAppUrl() || new URL(request.url).origin;
    const destination = new URL("/dashboard/bids", appUrl);
    if (!redirectInfo || redirectInfo.action !== "purchase" || !redirectInfo.license_id) {
      destination.searchParams.set("checkout", "invalid");
      return NextResponse.redirect(destination);
    }
    const purchase = await freemius.purchase.retrievePurchase(redirectInfo.license_id);
    const result = purchase ? await activateFreemiusPurchase(`redirect_${redirectInfo.license_id}`, purchase) : { ok: false, message: "Purchase not found." };
    destination.searchParams.set("checkout", result.ok ? "success" : "pending");
    return NextResponse.redirect(destination);
  } catch {
    const appUrl = publicAppUrl() || new URL(request.url).origin;
    const destination = new URL("/dashboard/bids", appUrl);
    destination.searchParams.set("checkout", "pending");
    return NextResponse.redirect(destination);
  }
}
