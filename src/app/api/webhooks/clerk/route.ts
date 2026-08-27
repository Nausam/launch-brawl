import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { getAdminDb } from "@/lib/firebase/admin";
import { logger } from "@/lib/server/log";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: "Clerk webhook is not configured." }, { status: 503 });

  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request, { signingSecret: webhookSecret });
  } catch {
    return NextResponse.json({ error: "Invalid Clerk webhook signature." }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });
  const eventId = request.headers.get("svix-id") || request.headers.get("webhook-id") || `${event.type}_${event.data.id}`;
  const eventRef = db.collection("clerkWebhookEvents").doc(eventId);

  try {
    const duplicate = await db.runTransaction(async (transaction) => {
      const eventSnapshot = await transaction.get(eventRef);
      if (eventSnapshot.exists) return true;

      switch (event.type) {
        case "user.created":
        case "user.updated": {
          const user = event.data;
          const userRef = db.collection("users").doc(user.id);
          const current = await transaction.get(userRef);
          const currentData = current.data() ?? {};
          const email = user.email_addresses?.[0]?.email_address ?? "";
          const baseUsername = (user.username || email.split("@")[0] || `maker-${user.id.slice(-6)}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || `maker-${user.id.slice(-6)}`;
          const currentUsername = typeof currentData.username === "string" ? currentData.username : "";
          let username = currentUsername || baseUsername;
          const preferredUsernameRef = db.collection("usernames").doc(username);
          const preferredUsername = await transaction.get(preferredUsernameRef);
          if (preferredUsername.exists && preferredUsername.data()?.userId !== user.id) username = `${baseUsername}-${user.id.slice(-6).toLowerCase()}`;
          const nextUsernameRef = db.collection("usernames").doc(username);
          const nextUsername = await transaction.get(nextUsernameRef);
          if (nextUsername.exists && nextUsername.data()?.userId !== user.id) throw new Error("Username reservation conflict.");
          if (currentUsername && currentUsername !== username) transaction.delete(db.collection("usernames").doc(currentUsername));
          transaction.set(nextUsernameRef, { userId: user.id, username, updatedAt: new Date() }, { merge: true });
          transaction.set(userRef, {
            id: user.id,
            clerkUserId: user.id,
            displayName: [user.first_name, user.last_name].filter(Boolean).join(" ") || username,
            username,
            email,
            imageUrl: user.image_url ?? "",
            status: "ACTIVE",
            role: currentData.role === "ADMIN" || currentData.role === "MODERATOR"
              ? currentData.role
              : (process.env.ADMIN_USER_IDS ?? "").split(",").map((value) => value.trim()).includes(user.id) ? "ADMIN" : "USER",
            updatedAt: new Date(),
            createdAt: currentData.createdAt ?? (typeof user.created_at === "number" ? new Date(user.created_at) : new Date()),
          }, { merge: true });
          break;
        }
        case "user.deleted": {
          const deletedId = event.data.id;
          if (!deletedId) break;
          const userRef = db.collection("users").doc(deletedId);
          await transaction.get(userRef);
          transaction.set(userRef, { status: "DELETED", email: "", updatedAt: new Date() }, { merge: true });
          break;
        }
        default:
          break;
      }

      transaction.set(eventRef, { id: eventId, type: event.type, processedAt: new Date() });
      return false;
    });

    return NextResponse.json({ received: true, ...(duplicate ? { duplicate: true } : {}) });
  } catch (error) {
    logger.error("clerk_webhook_failed", { eventId, type: event.type, reason: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Clerk webhook processing failed." }, { status: 500 });
  }
}
