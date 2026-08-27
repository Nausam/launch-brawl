import { logger } from "@/lib/server/log";

export async function sendTransactionalEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || !to) return { sent: false, reason: "not-configured" as const };
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, text }), cache: "no-store" });
    if (!response.ok) throw new Error(`Resend returned ${response.status}.`);
    return { sent: true } as const;
  } catch (error) {
    logger.error("transactional_email_failed", { reason: error instanceof Error ? error.message : "unknown" });
    return { sent: false, reason: "delivery-failed" as const };
  }
}
