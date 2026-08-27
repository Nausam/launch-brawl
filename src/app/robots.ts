import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/discover", "/product/", "/category/", "/league/", "/brawls", "/brawl/", "/winners/", "/seasons/", "/profile/"],
      disallow: ["/admin/", "/dashboard/", "/api/", "/sign-in", "/sign-up", "/go/"],
    }],
    sitemap: `${siteConfig.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
