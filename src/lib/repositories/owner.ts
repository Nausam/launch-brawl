import { format, subDays } from "date-fns";
import { disableAdminDb, getAdminDb, isFirestoreUnavailableError } from "@/lib/firebase/admin";
import type { AppUser, Campaign, Notification, PricingType, Product, ProductMember } from "@/lib/types";
import { asCampaign, asNotification, asProduct, asUser, searchTokens, type StoreRecord } from "@/lib/repositories/documents";
import { assertSafeRemoteHost, normalizeWebsiteUrl } from "@/lib/server/website-metadata";
import { recordAdminAuditLog } from "@/lib/server/audit";
import { findProductById } from "@/lib/repositories/catalog";

const productColors = ["#FF7058", "#5B7CFF", "#E6A43D", "#DB6AA6", "#39A98D", "#7254CA", "#3C97C9"];

function withoutUndefined(value: object) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function rememberUnavailable(error: unknown) {
  if (isFirestoreUnavailableError(error)) disableAdminDb();
}

async function assertSubmittedRemoteUrls(urls: Array<string | undefined>) {
  for (const value of urls.filter((entry): entry is string => Boolean(entry))) {
    const url = normalizeWebsiteUrl(value);
    await assertSafeRemoteHost(url.hostname);
  }
}

function hasLaunchMetadata(metadata: Product["launchMetadata"] | undefined) {
  return Boolean(metadata && Object.values(metadata).some((value) => typeof value === "string" && value.trim()));
}

function launchEventStatus(eventAt: string | undefined, now: Date) {
  if (!eventAt) return "SCHEDULED" as const;
  const timestamp = Date.parse(eventAt);
  if (!Number.isFinite(timestamp)) return "SCHEDULED" as const;
  return timestamp > now.getTime() ? "SCHEDULED" as const : "LIVE" as const;
}

async function assertOwnedMediaUpload(db: FirebaseFirestore.Firestore, userId: string, url: string | undefined, kind: "logo" | "cover") {
  const publicBase = process.env.STORAGE_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!url || !publicBase || !url.startsWith(`${publicBase}/uploads/`)) return;
  const key = url.slice(publicBase.length + 1).split("?")[0] ?? "";
  const recordId = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  const snapshot = await db.collection("uploadRecords").doc(recordId).get();
  const data = snapshot.data() ?? {};
  if (!snapshot.exists || String(data.userId ?? "") !== userId || String(data.kind ?? "") !== kind || String(data.status ?? "") !== "COMPLETED") throw new Error("That uploaded image is not owned by this account or has not been verified.");
}

async function canManageProduct(db: FirebaseFirestore.Firestore, user: AppUser, product: Product) {
  if (user.role === "ADMIN" || product.ownerId === user.id) return true;
  const member = await db.collection("productMembers").doc(`${product.id}_${user.id}`).get();
  return member.exists && ["OWNER", "EDITOR"].includes(String(member.data()?.role ?? ""));
}

function asProductMember(id: string, data: StoreRecord): ProductMember {
  const role = ["OWNER", "EDITOR", "VIEWER", "INVITED"].includes(String(data.role)) ? String(data.role) as ProductMember["role"] : "VIEWER";
  const status = ["ACTIVE", "PENDING", "REMOVED"].includes(String(data.status)) ? String(data.status) as ProductMember["status"] : "ACTIVE";
  const iso = (value: unknown) => value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function" ? value.toDate().toISOString() : typeof value === "string" ? value : undefined;
  return { id, productId: String(data.productId ?? ""), userId: String(data.userId ?? ""), role, status, invitedBy: typeof data.invitedBy === "string" ? data.invitedBy : undefined, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt) };
}

async function findInvitedUser(db: FirebaseFirestore.Firestore, identifier: string) {
  const direct = await db.collection("users").doc(identifier).get();
  if (direct.exists) return asUser(direct.id, direct.data() as StoreRecord);
  const byUsername = await db.collection("users").where("username", "==", identifier.toLowerCase()).limit(1).get();
  if (!byUsername.empty) return asUser(byUsername.docs[0].id, byUsername.docs[0].data() as StoreRecord);
  const byEmail = await db.collection("users").where("email", "==", identifier.toLowerCase()).limit(1).get();
  return byEmail.empty ? undefined : asUser(byEmail.docs[0].id, byEmail.docs[0].data() as StoreRecord);
}

export async function listProductMembers(productId: string): Promise<Array<ProductMember & { user?: AppUser }>> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("productMembers").where("productId", "==", productId).limit(50).get();
    const members = snapshot.docs.map((document) => asProductMember(document.id, document.data() as StoreRecord));
    const users = await Promise.all(members.map((member) => db.collection("users").doc(member.userId).get()));
    return members.map((member, index) => ({ ...member, user: users[index]?.exists ? asUser(users[index].id, users[index].data() as StoreRecord) : undefined }));
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function inviteProductMember(user: AppUser, productId: string, identifier: string, role: "EDITOR" | "VIEWER") {
  const db = getAdminDb();
  if (!db) throw new Error("Product persistence is unavailable until Firestore is configured.");
  const product = await findProductById(productId);
  if (!product || !(await canManageProduct(db, user, product)) || (user.role !== "ADMIN" && product.ownerId !== user.id)) throw new Error("Only the product owner can invite members.");
  const invited = await findInvitedUser(db, identifier.trim());
  if (!invited) throw new Error("No Launch Brawl user matches that username or email.");
  if (invited.id === product.ownerId) throw new Error("That user is already the product owner.");
  const now = new Date();
  const id = `${productId}_${invited.id}`;
  await db.collection("productMembers").doc(id).set({ id, productId, userId: invited.id, role, status: "PENDING", invitedBy: user.id, createdAt: now, updatedAt: now }, { merge: true });
  await db.collection("notifications").doc(`PRODUCT_MEMBER_INVITED_${invited.id}_${productId}`).set({ id: `PRODUCT_MEMBER_INVITED_${invited.id}_${productId}`, userId: invited.id, type: "PRODUCT_MEMBER_INVITED", title: `You were invited to ${product.name}`, body: `You have been invited as a ${role.toLowerCase()} for ${product.name}.`, entityId: productId, href: `/dashboard/products/${productId}`, tone: "neutral", read: false, createdAt: now, updatedAt: now }, { merge: true });
  await recordAdminAuditLog({ actorId: user.id, action: "PRODUCT_MEMBER_INVITED", entityType: "product", entityId: productId, metadata: { invitedUserId: invited.id, role } });
  return { id, userId: invited.id, role };
}

export async function respondToProductInvitation(user: AppUser, productId: string, action: "ACCEPT" | "DECLINE") {
  const db = getAdminDb();
  if (!db) throw new Error("Product persistence is unavailable until Firestore is configured.");
  const ref = db.collection("productMembers").doc(`${productId}_${user.id}`);
  const snapshot = await ref.get();
  if (!snapshot.exists || String(snapshot.data()?.status) !== "PENDING") throw new Error("This product invitation is no longer available.");
  await ref.update({ status: action === "ACCEPT" ? "ACTIVE" : "REMOVED", respondedAt: new Date(), updatedAt: new Date() });
  await recordAdminAuditLog({ actorId: user.id, action: `PRODUCT_MEMBER_INVITATION_${action}`, entityType: "product", entityId: productId });
  return { ok: true };
}

export async function updateProductMember(user: AppUser, productId: string, memberUserId: string, role: "EDITOR" | "VIEWER" | "REMOVED") {
  const db = getAdminDb();
  if (!db) throw new Error("Product persistence is unavailable until Firestore is configured.");
  const product = await findProductById(productId);
  if (!product || (user.role !== "ADMIN" && product.ownerId !== user.id)) throw new Error("Only the product owner can manage members.");
  if (memberUserId === product.ownerId) throw new Error("Transfer ownership before changing the owner role.");
  const ref = db.collection("productMembers").doc(`${productId}_${memberUserId}`);
  if (!(await ref.get()).exists) throw new Error("Product member not found.");
  await ref.set({ role: role === "REMOVED" ? "VIEWER" : role, status: role === "REMOVED" ? "REMOVED" : "ACTIVE", updatedAt: new Date() }, { merge: true });
  await recordAdminAuditLog({ actorId: user.id, action: "PRODUCT_MEMBER_UPDATED", entityType: "product", entityId: productId, metadata: { memberUserId, role } });
  return { ok: true };
}

export async function transferProductOwnership(user: AppUser, productId: string, newOwnerId: string) {
  const db = getAdminDb();
  if (!db) throw new Error("Product persistence is unavailable until Firestore is configured.");
  const productRef = db.collection("products").doc(productId);
  const newOwnerRef = db.collection("users").doc(newOwnerId);
  const oldMemberRef = db.collection("productMembers").doc(`${productId}_${user.id}`);
  const newMemberRef = db.collection("productMembers").doc(`${productId}_${newOwnerId}`);
  const now = new Date();
  await db.runTransaction(async (transaction) => {
    const [productSnapshot, newOwnerSnapshot] = await Promise.all([transaction.get(productRef), transaction.get(newOwnerRef)]);
    if (!productSnapshot.exists || !newOwnerSnapshot.exists) throw new Error("Product or new owner not found.");
    const current = productSnapshot.data() as StoreRecord;
    if (user.role !== "ADMIN" && String(current.ownerId ?? "") !== user.id) throw new Error("Only the product owner can transfer ownership.");
    const owner = asUser(newOwnerSnapshot.id, newOwnerSnapshot.data() as StoreRecord);
    transaction.update(productRef, { ownerId: newOwnerId, makerName: owner.displayName, makerAvatarUrl: owner.imageUrl ?? "", ownershipStatus: "VERIFIED", updatedAt: now });
    transaction.set(newMemberRef, { id: newMemberRef.id, productId, userId: newOwnerId, role: "OWNER", status: "ACTIVE", createdAt: now, updatedAt: now }, { merge: true });
    transaction.set(oldMemberRef, { role: "EDITOR", status: "ACTIVE", updatedAt: now }, { merge: true });
  });
  await recordAdminAuditLog({ actorId: user.id, action: "PRODUCT_OWNERSHIP_TRANSFERRED", entityType: "product", entityId: productId, metadata: { newOwnerId } });
  return { ok: true };
}

export async function listOwnerProducts(ownerId: string): Promise<Product[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const [owned, memberSnapshot] = await Promise.all([
      db.collection("products").where("ownerId", "==", ownerId).get(),
      db.collection("productMembers").where("userId", "==", ownerId).where("status", "==", "ACTIVE").limit(100).get(),
    ]);
    const ownedProducts = owned.docs.map((doc) => asProduct(doc.id, doc.data() as StoreRecord));
    const memberProductIds = memberSnapshot.docs.filter((doc) => ["OWNER", "EDITOR"].includes(String(doc.data()?.role ?? ""))).map((doc) => String(doc.data()?.productId ?? ""));
    const memberProducts = await Promise.all(memberProductIds.filter((id) => !ownedProducts.some((product) => product.id === id)).map((id) => db.collection("products").doc(id).get()));
    return [...ownedProducts, ...memberProducts.filter((doc) => doc.exists).map((doc) => asProduct(doc.id, doc.data() as StoreRecord))];
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function findOwnerProduct(ownerId: string, productId: string) {
  const db = getAdminDb();
  if (!db) return undefined;
  try {
    const snapshot = await db.collection("products").doc(productId).get();
    if (!snapshot.exists) return undefined;
    const product = asProduct(snapshot.id, snapshot.data() as StoreRecord);
    return (await canManageProduct(db, { id: ownerId } as AppUser, product)) ? product : undefined;
  } catch (error) {
    rememberUnavailable(error);
    return undefined;
  }
}

export async function listOwnerCampaigns(ownerId: string): Promise<Campaign[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("campaigns").where("ownerId", "==", ownerId).get();
    if (!snapshot.empty) return snapshot.docs.map((doc) => asCampaign(doc.id, doc.data() as StoreRecord));
    const products = await listOwnerProducts(ownerId);
    const productIds = new Set(products.map((product) => product.id));
    if (productIds.size === 0) return [];
    const all = await db.collection("campaigns").get();
    return all.docs.map((doc) => asCampaign(doc.id, doc.data() as StoreRecord)).filter((campaign) => productIds.has(campaign.productId));
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function findOwnerCampaign(ownerId: string, campaignId: string) {
  const campaigns = await listOwnerCampaigns(ownerId);
  return campaigns.find((campaign) => campaign.id === campaignId);
}

export async function listOwnerNotifications(ownerId: string): Promise<Notification[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snapshot = await db.collection("notifications").where("userId", "==", ownerId).get();
    return snapshot.docs
      .map((doc) => asNotification(doc.id, doc.data() as StoreRecord))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function reachSeriesFromCampaigns(campaigns: Campaign[]) {
  const db = getAdminDb();
  if (!db || campaigns.length === 0) return [];
  const dates = Array.from({ length: 7 }, (_, index) => format(subDays(new Date(), 6 - index), "yyyy-MM-dd"));
  const byDate = new Map(dates.map((date) => [date, { day: format(new Date(`${date}T00:00:00Z`), "EEE"), impressions: 0, clicks: 0 }]));
  try {
    const snapshots = await Promise.all(campaigns.map((campaign) => db.collection("campaignDailyStats").where("campaignId", "==", campaign.id).where("date", "in", dates).get()));
    let hasEvents = false;
    for (const snapshot of snapshots) {
      for (const document of snapshot.docs) {
        const data = document.data();
        const date = typeof data.date === "string" ? data.date : "";
        const point = byDate.get(date);
        if (!point) continue;
        const impressions = Number(data.impressions ?? data.qualifiedImpressions ?? 0);
        const clicks = Number(data.clicks ?? data.qualifiedClicks ?? 0);
        point.impressions += Number.isFinite(impressions) ? impressions : 0;
        point.clicks += Number.isFinite(clicks) ? clicks : 0;
        hasEvents ||= impressions > 0 || clicks > 0;
      }
    }
    return hasEvents ? dates.map((date) => byDate.get(date)!) : [];
  } catch (error) {
    rememberUnavailable(error);
    return [];
  }
}

export async function createOwnerProduct(user: AppUser, input: {
  name: string;
  websiteUrl: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  pricingType: PricingType;
  logoUrl?: string;
  coverImageUrl?: string;
  launchDate?: string;
  socialLinks?: Product["socialLinks"];
  launchMetadata?: Product["launchMetadata"];
  makerIds?: string[];
}) {
  const slugBase = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product";
  const color = productColors[Math.abs(input.name.length) % productColors.length];
  const searchName = input.name.toLowerCase();
  const searchTerms = searchTokens(`${input.name} ${input.shortDescription} ${input.fullDescription} ${input.categoryId} ${user.displayName}`);
  const db = getAdminDb();
  if (db) {
    try {
      await assertSubmittedRemoteUrls([
        input.websiteUrl,
        input.logoUrl,
        input.coverImageUrl,
        input.launchMetadata?.eventUrl,
        ...Object.values(input.socialLinks ?? {}),
      ]);
      await assertOwnedMediaUpload(db, user.id, input.logoUrl, "logo");
      await assertOwnedMediaUpload(db, user.id, input.coverImageUrl, "cover");
      const ref = db.collection("products").doc();
      const slug = `${slugBase}-${ref.id.slice(0, 6)}`;
      const categorySnapshot = await db.collection("categories").doc(input.categoryId).get();
      if (!categorySnapshot.exists || categorySnapshot.data()?.active === false) throw new Error("That category is not available.");
      const duplicateSnapshot = await db.collection("products").where("websiteUrl", "==", input.websiteUrl).limit(10).get();
      const duplicate = duplicateSnapshot.docs.find((document) => ["PENDING", "PUBLISHED", "DRAFT"].includes(String(document.data()?.status ?? "")));
      if (duplicate) throw new Error("A product with that website is already listed.");
      const product = asProduct(ref.id, {
        ...input,
        slug,
        ownerId: user.id,
        makerName: user.displayName,
        makerAvatarUrl: user.imageUrl,
        status: "PENDING",
        launchDate: input.launchDate ?? new Date().toISOString().slice(0, 10),
        verified: false,
        featured: false,
        totalVotes: 0,
        totalClicks: 0,
        totalQualifiedClicks: 0,
        totalViews: 0,
        totalFavorites: 0,
        bidCents: 0,
        position: 0,
        trend: "new",
        color,
        tags: [],
        makerIds: [...new Set([user.id, ...(input.makerIds ?? [])])],
        makerCount: Math.max(1, new Set([user.id, ...(input.makerIds ?? [])]).size),
        ownershipStatus: "VERIFIED",
        organicVotes: 0,
        organicQualifiedClicks: 0,
        organicViews: 0,
        organicFavorites: 0,
        paidQualifiedClicks: 0,
        paidImpressions: 0,
      });
      const now = new Date();
      const persistedProduct = withoutUndefined({ ...product, searchName, searchTerms, createdAt: now, updatedAt: now });
      await db.runTransaction(async (transaction) => {
        const slugRef = db.collection("productSlugs").doc(slug);
        const taken = await transaction.get(slugRef);
        if (taken.exists) throw new Error("That product slug is already reserved.");
        transaction.set(slugRef, { slug, productId: ref.id, ownerId: user.id, createdAt: now });
        transaction.set(ref, persistedProduct);
        transaction.set(db.collection("productMembers").doc(`${ref.id}_${user.id}`), { id: `${ref.id}_${user.id}`, productId: ref.id, userId: user.id, role: "OWNER", createdAt: now, updatedAt: now }, { merge: true });
        if (hasLaunchMetadata(input.launchMetadata)) transaction.set(db.collection("launchEvents").doc(ref.id), { id: ref.id, productId: ref.id, ...input.launchMetadata, status: launchEventStatus(input.launchMetadata?.eventAt, now), createdAt: now, updatedAt: now }, { merge: true });
      });
      await recordAdminAuditLog({ actorId: user.id, action: "PRODUCT_SUBMITTED", entityType: "product", entityId: ref.id });
      return product;
    } catch (error) {
      rememberUnavailable(error);
      if (error instanceof Error && /category|slug|address|website|URL|resolve/i.test(error.message)) throw error;
      if (process.env.NODE_ENV === "production") throw error;
    }
  }
  throw new Error("Product persistence is unavailable until Firestore is configured.");
}

export async function updateOwnerProduct(user: AppUser, productId: string, input: Partial<{
  name: string;
  websiteUrl: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  pricingType: PricingType;
  logoUrl?: string;
  coverImageUrl?: string;
  launchDate?: string;
  socialLinks?: Product["socialLinks"];
  launchMetadata?: Product["launchMetadata"];
  makerIds?: string[];
}>) {
  const db = getAdminDb();
  if (!db) throw new Error("Product persistence is unavailable until Firestore is configured.");
  const ref = db.collection("products").doc(productId);
  const currentSnapshot = await ref.get();
  if (!currentSnapshot.exists) throw new Error("Product not found.");
  const current = asProduct(ref.id, currentSnapshot.data() as StoreRecord);
  if (!(await canManageProduct(db, user, current))) throw new Error("You do not own this product.");
  await assertSubmittedRemoteUrls([
    input.websiteUrl,
    input.logoUrl,
    input.coverImageUrl,
    input.launchMetadata?.eventUrl,
    ...Object.values(input.socialLinks ?? {}),
  ]);
  await assertOwnedMediaUpload(db, user.id, input.logoUrl, "logo");
  await assertOwnedMediaUpload(db, user.id, input.coverImageUrl, "cover");
  const next = { ...current, ...input };
  const slugBase = next.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product";
  const slug = `${slugBase}-${productId.slice(0, 6)}`;
  const searchName = next.name.toLowerCase();
  const searchTerms = searchTokens(`${next.name} ${next.shortDescription} ${next.fullDescription} ${next.categoryId} ${next.makerName} ${next.tags.join(" ")}`);
  await db.runTransaction(async (transaction) => {
    const latest = await transaction.get(ref);
    if (!latest.exists) throw new Error("Product not found.");
    const latestData = latest.data() as StoreRecord;
    if (String(latestData.ownerId ?? "") !== user.id && user.role !== "ADMIN") {
      const memberSnapshot = await transaction.get(db.collection("productMembers").doc(`${productId}_${user.id}`));
      if (!memberSnapshot.exists || !["OWNER", "EDITOR"].includes(String(memberSnapshot.data()?.role ?? ""))) throw new Error("You do not own this product.");
    }
    if (input.categoryId) {
      const categorySnapshot = await transaction.get(db.collection("categories").doc(input.categoryId));
      if (!categorySnapshot.exists || categorySnapshot.data()?.active === false) throw new Error("That category is not available.");
    }
    const slugRef = db.collection("productSlugs").doc(slug);
    const slugSnapshot = await transaction.get(slugRef);
    if (slugSnapshot.exists && slugSnapshot.data()?.productId !== productId) throw new Error("That product slug is already reserved.");
    if (current.slug !== slug) transaction.delete(db.collection("productSlugs").doc(current.slug));
    transaction.set(slugRef, { slug, productId, ownerId: current.ownerId, updatedAt: new Date() }, { merge: true });
    transaction.update(ref, {
      ...input,
      ...(input.makerIds ? { makerIds: [...new Set([current.ownerId, ...input.makerIds])], makerCount: new Set([current.ownerId, ...input.makerIds]).size } : {}),
      slug,
      searchName,
      searchTerms,
      status: user.role === "ADMIN" ? current.status : current.status === "PUBLISHED" ? "PENDING" : current.status,
      updatedAt: new Date(),
    });
    if (input.launchMetadata !== undefined) {
      const launchEventRef = db.collection("launchEvents").doc(productId);
      if (hasLaunchMetadata(input.launchMetadata)) transaction.set(launchEventRef, { id: productId, productId, ...input.launchMetadata, status: launchEventStatus(input.launchMetadata.eventAt, new Date()), updatedAt: new Date() }, { merge: true });
      else transaction.delete(launchEventRef);
    }
  });
  await recordAdminAuditLog({ actorId: user.id, action: "PRODUCT_UPDATED", entityType: "product", entityId: productId });
  return { ...next, slug, status: user.role === "ADMIN" ? current.status : current.status === "PUBLISHED" ? "PENDING" : current.status } as Product;
}

export async function archiveOwnerProduct(user: AppUser, productId: string) {
  const db = getAdminDb();
  if (!db) throw new Error("Product persistence is unavailable until Firestore is configured.");
  const ref = db.collection("products").doc(productId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("Product not found.");
    if (String(snapshot.data()?.ownerId ?? "") !== user.id && user.role !== "ADMIN") {
      const memberSnapshot = await transaction.get(db.collection("productMembers").doc(`${productId}_${user.id}`));
      if (!memberSnapshot.exists || String(memberSnapshot.data()?.role ?? "") !== "OWNER") throw new Error("You do not own this product.");
    }
    transaction.update(ref, { status: "ARCHIVED", updatedAt: new Date(), archivedBy: user.id });
  });
  await recordAdminAuditLog({ actorId: user.id, action: "PRODUCT_ARCHIVED", entityType: "product", entityId: productId });
  return { ok: true };
}
