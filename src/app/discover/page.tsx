import { getLeaderboard, getMostClickedProducts, getMostLovedProducts, getMostVotedProducts, getNewProducts, getTrendingProducts, listCategories } from "@/lib/repositories/catalog";
import type { DiscoveryFilter, Product } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { DirectoryHeader } from "@/components/discovery/DirectoryHeader";
import { DiscoverProductBoard } from "@/components/discovery/DiscoverProductBoard";

export const metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

const allowedSorts: DiscoveryFilter[] = ["trending", "new", "loved", "clicked", "voted"];
const allowedPricing = ["Free", "Freemium", "Paid", "Open source"] as const;
const allowedLaunch = ["today", "week", "upcoming", "recent"] as const;

type LaunchWindow = (typeof allowedLaunch)[number];

function productsForSort(sort: DiscoveryFilter) {
  switch (sort) {
    case "new":
      return getNewProducts();
    case "loved":
      return getMostLovedProducts();
    case "clicked":
      return getMostClickedProducts();
    case "voted":
      return getMostVotedProducts();
    case "trending":
      return getTrendingProducts();
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

function matchesLaunchWindow(product: Product, launch: LaunchWindow, startOfToday: number) {
  const launchTime = new Date(`${product.launchDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(launchTime)) return false;
  switch (launch) {
    case "today":
      return launchTime === startOfToday;
    case "week":
      return launchTime >= startOfToday && launchTime < startOfToday + 7 * 86_400_000;
    case "upcoming":
      return launchTime >= startOfToday + 7 * 86_400_000;
    case "recent":
      return launchTime < startOfToday && launchTime >= startOfToday - 30 * 86_400_000;
    default: {
      const _exhaustive: never = launch;
      return _exhaustive;
    }
  }
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ category?: string; sort?: string; pricing?: string; launch?: string }> }) {
  const params = await searchParams;
  const sort = allowedSorts.includes(params.sort as DiscoveryFilter) ? params.sort as DiscoveryFilter : "trending";
  const [categories, leaderboard, sortedProducts] = await Promise.all([listCategories(), getLeaderboard(), productsForSort(sort)]);
  const sponsoredIds = new Set(leaderboard.map((product) => product.id));
  const pricing = allowedPricing.includes(params.pricing as (typeof allowedPricing)[number]) ? params.pricing : undefined;
  const launch = allowedLaunch.includes(params.launch as LaunchWindow) ? params.launch as LaunchWindow : undefined;
  const today = new Date();
  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const products = sortedProducts.filter((product) => !sponsoredIds.has(product.id)).filter((product) => !pricing || product.pricingType === pricing).filter((product) => {
    if (!launch) return true;
    return matchesLaunchWindow(product, launch, startOfToday);
  }).slice(0, 16);
  const selectedCategory = params.category ? categories.find((category) => category.slug === params.category) : undefined;
  const visibleProducts = selectedCategory ? products.filter((product) => product.categoryId === selectedCategory.id) : products;
  const visibleSponsored = selectedCategory ? leaderboard.filter((product) => product.categoryId === selectedCategory.id) : leaderboard;

  return (
    <>
      <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -left-[28%] -top-52 h-[500px] w-[156%] rounded-[50%] border-[18px] border-[#eef3f8]" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full border-[32px] border-coral/10" />
        <PageContainer className="relative pt-14 pb-3 lg:pt-20 lg:pb-4">
          <DirectoryHeader
            arena
            active={sort}
            title="Discover the next thing"
            description="A living directory of products, tools, games, and experiments made by people with something to share."
            productCount={visibleProducts.length + visibleSponsored.length}
            sponsoredCount={visibleSponsored.length}
            categoryCount={categories.length}
            categories={categories}
            activeCategory={selectedCategory?.slug}
            activePricing={pricing}
            activeLaunch={launch}
          />
        </PageContainer>
      </section>
      <DiscoverProductBoard products={visibleProducts} sponsoredProducts={visibleSponsored} categories={categories} categoryName={selectedCategory?.name} />
    </>
  );
}
