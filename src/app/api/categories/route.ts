import { NextResponse } from "next/server";
import { listCategories } from "@/lib/repositories/catalog";

export async function GET() {
  return NextResponse.json({ categories: await listCategories() }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
