export const siteConfig = {
  name: "Launch Brawl",
  tagline: "Fight for attention. Earn the spotlight.",
  secondary: "Discover what the internet is launching today.",
  description:
    "Launch Brawl is the transparent product discovery platform where ambitious launches compete for attention and every paid bid buys measurable exposure.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  navigation: [
    { label: "Discover", href: "/discover" },
    { label: "The Daily Brawl", href: "/" },
    { label: "Trending", href: "/trending" },
    { label: "Launches", href: "/launches" },
    { label: "Brawls", href: "/brawls" },
    { label: "Leagues", href: "/leagues" },
    { label: "Activity", href: "/activity" },
  ],
  footerNavigation: {
    Explore: [
      { label: "Discover", href: "/discover" },
      { label: "Trending", href: "/trending" },
      { label: "New products", href: "/new" },
      { label: "Most loved", href: "/most-loved" },
      { label: "Categories", href: "/categories" },
    ],
    Compete: [
      { label: "Submit a product", href: "/submit" },
      { label: "The Daily Brawl", href: "/" },
      { label: "Brawls", href: "/brawls" },
      { label: "Leagues", href: "/leagues" },
      { label: "Seasons", href: "/seasons" },
      { label: "Daily Picks", href: "/picks" },
      { label: "Tastemakers", href: "/tastemakers" },
      { label: "Live activity", href: "/activity" },
      { label: "Hall of Fame", href: "/hall-of-fame" },
      { label: "Winner archive", href: "/winners" },
      { label: "Pricing", href: "/pricing" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Advertising", href: "/legal/advertising" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
