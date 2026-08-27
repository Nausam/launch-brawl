import { getFreemius, freemiusIsConfigured } from "@/lib/integrations/freemius";
import { activateFreemiusPurchase, revokeFreemiusLicense } from "@/lib/repositories/payments";
import { logger } from "@/lib/server/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const freemius = getFreemius();
  if (!freemius || !freemiusIsConfigured()) return Response.json({ error: "Freemius webhook is not configured." }, { status: 503 });

  const listener = freemius.webhook.createListener({
    onError: async (error) => {
      logger.error("freemius_webhook_handler_failed", { reason: error instanceof Error ? error.message : "unknown" });
    },
  });

  listener.on("license.created", async (event) => {
    const licenseId = event.data.license_id;
    const purchase = await freemius.purchase.retrievePurchase(licenseId);
    if (!purchase) throw new Error("Freemius purchase could not be retrieved.");
    const result = await activateFreemiusPurchase(`webhook_${event.id}`, purchase);
    if (!result.ok && result.retryable) throw new Error(result.message);
  });

  listener.on(["license.cancelled", "license.deleted", "license.expired"], async (event) => {
    const licenseId = event.data.license_id;
    const result = await revokeFreemiusLicense(`webhook_${event.id}`, licenseId, event.type);
    if (!result.ok && /Firestore|Unable/.test(result.message)) throw new Error(result.message);
  });

  try {
    return await freemius.webhook.createRequestProcessor(listener)(request);
  } catch (error) {
    logger.error("freemius_webhook_failed", { reason: error instanceof Error ? error.message : "unknown" });
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
