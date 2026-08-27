import { auth, currentUser } from "@clerk/nextjs/server";
import { disableAdminDb, getAdminDb, isFirestoreUnavailableError } from "@/lib/firebase/admin";
import type { AppUser } from "@/lib/types";
import { requiresPersistentData } from "@/lib/server/runtime";
import { isBlockedHost } from "@/lib/server/website-metadata";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export function authIsConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "maker";
}

function safeProfileUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password || isBlockedHost(url.hostname)) return "";
    return value;
  } catch {
    return "";
  }
}

export function mapClerkUser(user: ClerkUser): AppUser {
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const username = slugify(user.username ?? email.split("@")[0] ?? `maker-${user.id.slice(-6)}`);
  const displayName = user.fullName?.trim() || user.firstName?.trim() || username;
  const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  return {
    id: user.id,
    clerkUserId: user.id,
    displayName,
    username,
    email,
    imageUrl: safeProfileUrl(user.imageUrl),
    website: safeProfileUrl(user.publicMetadata.website),
    bio: typeof user.publicMetadata.bio === "string" ? user.publicMetadata.bio : "",
    notificationPreferences: { email: true, productActivity: true, competitive: true, campaigns: true },
    emailDeliveryState: "UNKNOWN",
    role: adminIds.includes(user.id) ? "ADMIN" : "USER",
  };
}

export function isStaff(user: AppUser) {
  return user.role === "ADMIN" || user.role === "MODERATOR";
}

export async function requireAdmin() {
  const user = await getCurrentAppUser();
  if (!user) return null;
  if (user.role !== "ADMIN") return null;
  return user;
}

export async function requireStaff() {
  const user = await getCurrentAppUser();
  if (!user || !isStaff(user)) return null;
  return user;
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return null;
  const clerk = await currentUser();
  if (!clerk) return null;
  const fromClerk = mapClerkUser(clerk);
  const db = getAdminDb();
  if (!db) return requiresPersistentData() ? null : fromClerk;
  try {
    const ref = db.collection("users").doc(fromClerk.id);
    const snapshot = await ref.get();
    if (snapshot.exists) {
      const data = snapshot.data() ?? {};
      if (data.status === "DELETED") return null;
      return {
        ...fromClerk,
        displayName: typeof data.displayName === "string" && data.displayName.trim() ? data.displayName : fromClerk.displayName,
        username: typeof data.username === "string" && data.username.trim() ? data.username : fromClerk.username,
        website: safeProfileUrl(data.website) || fromClerk.website,
        imageUrl: safeProfileUrl(data.imageUrl) || fromClerk.imageUrl,
        bio: typeof data.bio === "string" ? data.bio : fromClerk.bio,
        notificationPreferences: data.notificationPreferences && typeof data.notificationPreferences === "object" ? {
          email: (data.notificationPreferences as Record<string, unknown>).email !== false,
          productActivity: (data.notificationPreferences as Record<string, unknown>).productActivity !== false,
          competitive: (data.notificationPreferences as Record<string, unknown>).competitive !== false,
          campaigns: (data.notificationPreferences as Record<string, unknown>).campaigns !== false,
        } : fromClerk.notificationPreferences,
        emailDeliveryState: data.emailDeliveryState === "ACTIVE" || data.emailDeliveryState === "BOUNCED" || data.emailDeliveryState === "UNSUBSCRIBED" ? data.emailDeliveryState : fromClerk.emailDeliveryState,
        role: data.role === "ADMIN" || fromClerk.role === "ADMIN" ? "ADMIN" : data.role === "MODERATOR" ? "MODERATOR" : "USER",
      };
    }
    await ref.set({
      id: fromClerk.id,
      clerkUserId: fromClerk.clerkUserId,
      displayName: fromClerk.displayName,
      username: fromClerk.username,
      email: fromClerk.email,
      imageUrl: fromClerk.imageUrl ?? "",
      website: fromClerk.website ?? "",
      bio: fromClerk.bio ?? "",
      notificationPreferences: fromClerk.notificationPreferences,
      emailDeliveryState: fromClerk.emailDeliveryState,
      role: fromClerk.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    if (isFirestoreUnavailableError(error)) disableAdminDb();
    return requiresPersistentData() ? null : fromClerk;
  }
  return fromClerk;
}

export async function requireCurrentAppUser() {
  const user = await getCurrentAppUser();
  if (!user) return null;
  return user;
}

export async function upsertClerkUserRecord(user: AppUser) {
  const db = getAdminDb();
  if (!db) throw new Error("User persistence is unavailable until Firestore is configured.");
  const ref = db.collection("users").doc(user.id);
  const current = await ref.get();
  await ref.set({
    id: user.id,
    clerkUserId: user.clerkUserId,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    imageUrl: user.imageUrl ?? "",
    website: user.website ?? "",
    bio: user.bio ?? "",
    notificationPreferences: user.notificationPreferences,
    emailDeliveryState: user.emailDeliveryState,
    ...(current.exists ? {} : { role: user.role, createdAt: new Date() }),
    updatedAt: new Date(),
  }, { merge: true });
  return user;
}

export async function saveAppUserProfile(userId: string, patch: Partial<Pick<AppUser, "displayName" | "username" | "website" | "bio" | "imageUrl" | "notificationPreferences">>) {
  const db = getAdminDb();
  if (!db) throw new Error("User persistence is unavailable until Firestore is configured.");
  try {
    const publicBase = process.env.STORAGE_PUBLIC_URL?.trim().replace(/\/$/, "");
    if (patch.imageUrl && publicBase && patch.imageUrl.startsWith(`${publicBase}/uploads/`)) {
      const key = patch.imageUrl.slice(publicBase.length + 1).split("?")[0] ?? "";
      const uploadId = key.replace(/[^a-zA-Z0-9_-]/g, "_");
      const upload = await db.collection("uploadRecords").doc(uploadId).get();
      const uploadData = upload.data() ?? {};
      if (!upload.exists || String(uploadData.userId ?? "") !== userId || String(uploadData.kind ?? "") !== "avatar" || String(uploadData.status ?? "") !== "COMPLETED") throw new Error("That avatar upload is not verified for this account.");
    }
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error("User record not found.");
      if (patch.username) {
        const usernameRef = db.collection("usernames").doc(patch.username.toLowerCase());
        const usernameSnap = await transaction.get(usernameRef);
        const currentUsername = typeof userSnap.data()?.username === "string" ? userSnap.data()?.username.toLowerCase() : "";
        if (usernameSnap.exists && usernameSnap.data()?.userId !== userId) throw new Error("That username is already taken.");
        if (currentUsername && currentUsername !== patch.username.toLowerCase()) transaction.delete(db.collection("usernames").doc(currentUsername));
        transaction.set(usernameRef, { userId, username: patch.username.toLowerCase(), updatedAt: new Date() });
      }
      transaction.update(userRef, { ...patch, ...(patch.username ? { username: patch.username.toLowerCase() } : {}), updatedAt: new Date() });
    });
  } catch (error) {
    if (isFirestoreUnavailableError(error)) disableAdminDb();
    throw error;
  }
  return patch;
}
