import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listCategories, listDailyWinners, listPublishedProducts } from "@/lib/repositories/catalog";
import { listBrawlsByStatus, listSeasons } from "@/lib/repositories/competitive";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const [products, categories, winners, brawls, seasons] = await Promise.all([listPublishedProducts(), listCategories(), listDailyWinners(200), listBrawlsByStatus("COMPLETED", 200), listSeasons()]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/discover`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/search`, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/advertising`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/refunds`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/trending`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/new`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/most-loved`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/brawls`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/leagues`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/seasons`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/hall-of-fame`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/launches`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/activity`, changeFrequency: "hourly", priority: 0.5 },
    { url: `${base}/tastemakers`, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/deals`, changeFrequency: "daily", priority: 0.4 },
    { url: `${base}/bounties`, changeFrequency: "daily", priority: 0.4 },
    { url: `${base}/quests`, changeFrequency: "daily", priority: 0.4 },
    { url: `${base}/picks`, changeFrequency: "daily", priority: 0.4 },
    { url: `${base}/pricing`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/winners`, changeFrequency: "weekly", priority: 0.5 },
    ...categories.filter((category) => category.active).map((category) => ({ url: `${base}/category/${category.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...categories.filter((category) => category.active).map((category) => ({ url: `${base}/league/${category.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...products.map((product) => ({ url: `${base}/product/${product.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...winners.map((winner) => ({ url: `${base}/winners/${winner.date}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...brawls.map((brawl) => ({ url: `${base}/brawl/${brawl.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...seasons.filter((season) => season.status === "COMPLETED").map((season) => ({ url: `${base}/seasons/${season.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
