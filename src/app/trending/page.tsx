import { getTrendingProducts, listCategories } from "@/lib/repositories/catalog";
import { TrendingPage } from "@/components/discovery/TrendingPage";

export const metadata = { title: "Trending" };
export const dynamic = "force-dynamic";

export default async function TrendingRoute() {
  const [products, categories] = await Promise.all([getTrendingProducts(), listCategories()]);
  return <TrendingPage products={products} categories={categories} />;
}
