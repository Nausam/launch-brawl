import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb, isFirestoreUnavailableError } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/integrations/auth";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(80, "Category name is too long."),
  slug: z.string().trim().max(80, "Slug is too long.").optional(),
  description: z.string().trim().max(240, "Description is too long.").optional(),
  icon: z.string().trim().min(1, "Choose an icon.").max(8, "Icon is too long."),
  accent: z.string().trim().regex(/^#[0-9a-f]{6}$/i, "Accent must be a six-digit hex color."),
  displayOrder: z.number().int().min(0).max(10_000).optional(),
});

class CategoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryConflictError";
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });

  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid category." }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Firestore is not configured." }, { status: 503 });

  const name = parsed.data.name.trim();
  const slug = slugify(parsed.data.slug?.trim() || name);
  if (!slug) return NextResponse.json({ error: "Use letters or numbers for the category name or slug." }, { status: 400 });

  let displayOrder = parsed.data.displayOrder;
  if (displayOrder === undefined) {
    const latest = await db.collection("categories").orderBy("displayOrder", "desc").limit(1).get();
    displayOrder = latest.empty ? 1 : Number(latest.docs[0].data().displayOrder ?? 0) + 1;
  }

  const now = new Date();
  try {
    await db.runTransaction(async (transaction) => {
      const categoryRef = db.collection("categories").doc(slug);
      const existingId = await transaction.get(categoryRef);
      if (existingId.exists) throw new CategoryConflictError("A category with this slug already exists.");

      const existingSlug = await transaction.get(db.collection("categories").where("slug", "==", slug).limit(1));
      if (!existingSlug.empty) throw new CategoryConflictError("A category with this slug already exists.");

      transaction.create(categoryRef, {
        id: slug,
        slug,
        name,
        description: parsed.data.description?.trim() ?? "",
        icon: parsed.data.icon.trim(),
        displayOrder,
        active: true,
        accent: parsed.data.accent.trim().toUpperCase(),
        createdAt: now,
        updatedAt: now,
        createdBy: admin.id,
      });

      const auditRef = db.collection("adminAuditLogs").doc();
      transaction.create(auditRef, {
        adminId: admin.id,
        action: "CATEGORY_CREATED",
        targetType: "category",
        targetId: slug,
        createdAt: now,
      });
    });
  } catch (error) {
    if (error instanceof CategoryConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (isFirestoreUnavailableError(error)) return NextResponse.json({ error: "Firestore is unavailable right now." }, { status: 503 });
    return NextResponse.json({ error: "The category could not be saved." }, { status: 500 });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/api/categories");
  revalidatePath("/submit");
  revalidatePath("/categories");

  return NextResponse.json({ ok: true, category: { id: slug, slug, name } }, { status: 201 });
}
