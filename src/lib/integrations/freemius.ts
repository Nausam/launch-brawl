import { Freemius } from "@freemius/sdk";

let freemius: Freemius | null | undefined;

export function freemiusIsConfigured() {
  return Boolean(
    process.env.FREEMIUS_PRODUCT_ID &&
    process.env.FREEMIUS_API_KEY &&
    process.env.FREEMIUS_SECRET_KEY &&
    process.env.FREEMIUS_PUBLIC_KEY &&
    process.env.FREEMIUS_PLAN_ID_SPONSORED_REACH,
  );
}

export function getFreemius() {
  if (freemius !== undefined) return freemius;
  if (!freemiusIsConfigured()) {
    freemius = null;
    return freemius;
  }
  freemius = new Freemius({
    productId: process.env.FREEMIUS_PRODUCT_ID!,
    apiKey: process.env.FREEMIUS_API_KEY!,
    secretKey: process.env.FREEMIUS_SECRET_KEY!,
    publicKey: process.env.FREEMIUS_PUBLIC_KEY!,
  });
  return freemius;
}

export function freemiusPlanId() {
  return process.env.FREEMIUS_PLAN_ID_SPONSORED_REACH ?? "";
}

export function freemiusIsSandbox() {
  return process.env.FREEMIUS_SANDBOX === "true";
}

export async function createFreemiusCheckout(input: {
  email: string;
  name?: string;
  quota: number;
  cancelUrl: string;
}) {
  const client = getFreemius();
  if (!client) return null;
  const checkout = await client.checkout.create({
    user: { email: input.email, name: input.name },
    isSandbox: freemiusIsSandbox(),
    withRecommendation: false,
    title: "Launch Brawl Sponsored Reach",
    planId: freemiusPlanId(),
    quota: input.quota,
  });
  return checkout
    .setBillingCycle("lifetime", "dropdown")
    .setCurrency("usd")
    .setDiscounts({ annual: false, multisite: false, bundle: false, showMonthlySwitch: false })
    .setCancelButton(input.cancelUrl)
    .getLink();
}
