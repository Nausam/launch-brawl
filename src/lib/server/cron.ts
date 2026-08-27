import { timingSafeEqual } from "node:crypto";

export function isCronAuthorized(request: Request) {
  const configured = process.env.CRON_SECRET;
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!configured || !received) return false;
  const expectedBuffer = Buffer.from(configured);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}
