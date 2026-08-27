import { NextResponse } from "next/server";
import { listProductAchievements, listUserAchievements } from "@/lib/repositories/competitive";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const userId = url.searchParams.get("userId");
  if (!productId && !userId) return NextResponse.json({ error: "Provide productId or userId." }, { status: 400 });
  const [products, users] = await Promise.all([productId ? listProductAchievements(productId) : Promise.resolve([]), userId ? listUserAchievements(userId) : Promise.resolve([])]);
  return NextResponse.json({ achievements: [...products, ...users] }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
