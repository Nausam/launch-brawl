import { addDays } from "date-fns";
import type { Brawl, Campaign, Category, LeaderboardRound, Product, Winner } from "@/lib/types";
import { calculateTrendingScore } from "@/lib/utils";

const categorySeeds: Array<Omit<Category, "displayOrder">> = [
  { id: "ai", slug: "ai", name: "AI", description: "Tools that make the next idea possible.", icon: "✦", active: true, accent: "#FF6B4A" },
  { id: "developer-tools", slug: "developer-tools", name: "Developer Tools", description: "Build, ship, and debug with less friction.", icon: "⌘", active: true, accent: "#5B7CFF" },
  { id: "productivity", slug: "productivity", name: "Productivity", description: "Small systems for meaningful progress.", icon: "◒", active: true, accent: "#E7A93F" },
  { id: "design", slug: "design", name: "Design", description: "Make the work feel as good as it functions.", icon: "◩", active: true, accent: "#E26AAB" },
  { id: "marketing", slug: "marketing", name: "Marketing", description: "Find the signal in a louder internet.", icon: "↗", active: true, accent: "#39A98D" },
  { id: "saas", slug: "saas", name: "SaaS", description: "Products with a recurring point of view.", icon: "▣", active: true, accent: "#7254CA" },
  { id: "mobile-apps", slug: "mobile-apps", name: "Mobile Apps", description: "Useful ideas that fit in your pocket.", icon: "▯", active: true, accent: "#3C97C9" },
  { id: "games", slug: "games", name: "Games", description: "Playful worlds made by small teams.", icon: "✚", active: true, accent: "#D55D52" },
  { id: "finance", slug: "finance", name: "Finance", description: "A calmer way to understand money.", icon: "$", active: true, accent: "#3E8E65" },
  { id: "education", slug: "education", name: "Education", description: "Learn something worth keeping.", icon: "∿", active: true, accent: "#D18C3C" },
  { id: "ecommerce", slug: "ecommerce", name: "Ecommerce", description: "Better tools for independent shops.", icon: "◇", active: true, accent: "#B86A9A" },
  { id: "open-source", slug: "open-source", name: "Open Source", description: "Public building blocks for everyone.", icon: "◎", active: true, accent: "#557A71" },
];

export const categories: Category[] = categorySeeds.map((category, index) => ({ ...category, displayOrder: index + 1 }));

type ProductSeed = Omit<Product, "id" | "slug" | "ownerId" | "status" | "verified" | "featured" | "position" | "previousPosition" | "trend" | "makerAvatarUrl" | "totalFavorites" | "makerCount"> & {
  categoryId: string;
  totalFavorites?: number;
  verified?: boolean;
  featured?: boolean;
};

const productSeeds: ProductSeed[] = [
  { name: "SupaAI", shortDescription: "A thoughtful AI chief of staff for the messy middle of work.", fullDescription: "SupaAI turns scattered notes, decisions, and follow-ups into a calm daily operating system for small teams.", websiteUrl: "https://supaai.example", categoryId: "ai", pricingType: "Freemium", launchDate: "2026-08-20", makerName: "Mina & team", totalVotes: 842, totalClicks: 3819, totalQualifiedClicks: 3510, totalViews: 24100, bidCents: 8400, color: "#FF7058", tags: ["AI", "Teams", "Assistant"], verified: true, featured: true },
  { name: "Pixelroom", shortDescription: "The collaborative moodboard that actually ships with you.", fullDescription: "Pixelroom gives design teams a shared visual room with references, decisions, and handoff notes in one place.", websiteUrl: "https://pixelroom.example", categoryId: "design", pricingType: "Paid", launchDate: "2026-08-19", makerName: "Aya Nakamura", totalVotes: 614, totalClicks: 3120, totalQualifiedClicks: 2862, totalViews: 18400, bidCents: 6200, color: "#DB6AA6", tags: ["Design", "Collaboration"], verified: true, featured: true },
  { name: "Loopnote", shortDescription: "Turn every meeting into a momentum loop.", fullDescription: "Loopnote records the decisions that matter and nudges the right person before the work goes stale.", websiteUrl: "https://loopnote.example", categoryId: "productivity", pricingType: "Freemium", launchDate: "2026-08-18", makerName: "Cedar Labs", totalVotes: 521, totalClicks: 2810, totalQualifiedClicks: 2444, totalViews: 16900, bidCents: 5100, color: "#E6A43D", tags: ["Meetings", "Focus"], verified: true, featured: false },
  { name: "Commitly", shortDescription: "A friendly code review queue for teams that care.", fullDescription: "Commitly keeps code review moving with lightweight ownership, context, and a little positive pressure.", websiteUrl: "https://commitly.example", categoryId: "developer-tools", pricingType: "Open source", launchDate: "2026-08-21", makerName: "Jon Bell", totalVotes: 488, totalClicks: 2740, totalQualifiedClicks: 2518, totalViews: 14300, bidCents: 4400, color: "#5B7CFF", tags: ["Git", "Open source"], verified: true, featured: true },
  { name: "Sidequest", shortDescription: "Find your next small adventure in under five minutes.", fullDescription: "Sidequest turns local recommendations into a weekly ritual for people who want to get out of the default loop.", websiteUrl: "https://sidequest.example", categoryId: "mobile-apps", pricingType: "Free", launchDate: "2026-08-17", makerName: "Nico & Liv", totalVotes: 433, totalClicks: 2388, totalQualifiedClicks: 2174, totalViews: 13100, bidCents: 3900, color: "#3C97C9", tags: ["Local", "Lifestyle"], verified: false, featured: false },
  { name: "Mosaic CRM", shortDescription: "A CRM for relationships, not pipelines.", fullDescription: "Mosaic CRM helps founder-led teams remember context, follow up well, and grow without turning people into stages.", websiteUrl: "https://mosaiccrm.example", categoryId: "saas", pricingType: "Paid", launchDate: "2026-08-15", makerName: "Jules Hart", totalVotes: 382, totalClicks: 2011, totalQualifiedClicks: 1782, totalViews: 11500, bidCents: 3500, color: "#7254CA", tags: ["CRM", "Sales"], verified: true, featured: false },
  { name: "Threadline", shortDescription: "A visual inbox for customer conversations.", fullDescription: "Threadline brings email, chat, and support threads together so small teams can respond with context.", websiteUrl: "https://threadline.example", categoryId: "marketing", pricingType: "Freemium", launchDate: "2026-08-14", makerName: "Sasha Okafor", totalVotes: 347, totalClicks: 1902, totalQualifiedClicks: 1650, totalViews: 10700, bidCents: 3200, color: "#39A98D", tags: ["Support", "Inbox"], verified: false, featured: false },
  { name: "Walletwise", shortDescription: "A quiet, human budget for irregular income.", fullDescription: "Walletwise gives freelancers a simple view of runway, taxes, and the next safe move.", websiteUrl: "https://walletwise.example", categoryId: "finance", pricingType: "Freemium", launchDate: "2026-08-13", makerName: "Tala Dev", totalVotes: 329, totalClicks: 1740, totalQualifiedClicks: 1509, totalViews: 9900, bidCents: 2900, color: "#3E8E65", tags: ["Money", "Freelance"], verified: true, featured: false },
  { name: "Cairn", shortDescription: "A reading trail for everything worth remembering.", fullDescription: "Cairn helps curious people save, connect, and revisit the ideas that have changed their mind.", websiteUrl: "https://cairn.example", categoryId: "education", pricingType: "Free", launchDate: "2026-08-12", makerName: "Nora East", totalVotes: 304, totalClicks: 1602, totalQualifiedClicks: 1387, totalViews: 9200, bidCents: 2500, color: "#D18C3C", tags: ["Reading", "Learning"], verified: false, featured: false },
  { name: "CloverCart", shortDescription: "The tiny storefront for people who make one great thing.", fullDescription: "CloverCart is a focused checkout and customer list for makers selling a small, excellent catalog.", websiteUrl: "https://clovercart.example", categoryId: "ecommerce", pricingType: "Paid", launchDate: "2026-08-11", makerName: "Owen Price", totalVotes: 286, totalClicks: 1420, totalQualifiedClicks: 1255, totalViews: 8600, bidCents: 2300, color: "#B86A9A", tags: ["Commerce", "Makers"], verified: false, featured: false },
  { name: "Beacon", shortDescription: "Open-source uptime checks with a human dashboard.", fullDescription: "Beacon makes service health visible without making operators live in a sea of alerts.", websiteUrl: "https://beacon.example", categoryId: "open-source", pricingType: "Open source", launchDate: "2026-08-10", makerName: "The Beacon crew", totalVotes: 271, totalClicks: 1355, totalQualifiedClicks: 1203, totalViews: 7900, bidCents: 2100, color: "#557A71", tags: ["Monitoring", "Open source"], verified: true, featured: false },
  { name: "Orbital", shortDescription: "A personal command center for recurring work.", fullDescription: "Orbital brings recurring tasks, rituals, and checklists together for people who run a lot of small systems.", websiteUrl: "https://orbital.example", categoryId: "productivity", pricingType: "Paid", launchDate: "2026-08-09", makerName: "Kian Shah", totalVotes: 255, totalClicks: 1322, totalQualifiedClicks: 1109, totalViews: 7300, bidCents: 1800, color: "#E6A43D", tags: ["Systems", "Planning"], verified: false, featured: false },
  { name: "Tiny Arcade", shortDescription: "Five-minute games for the gaps in your day.", fullDescription: "Tiny Arcade is a collection of quick, handcrafted games built for a friendly break rather than an endless loop.", websiteUrl: "https://tinyarcade.example", categoryId: "games", pricingType: "Free", launchDate: "2026-08-08", makerName: "Piper Games", totalVotes: 246, totalClicks: 1288, totalQualifiedClicks: 1150, totalViews: 6900, bidCents: 1500, color: "#D55D52", tags: ["Games", "Play"], verified: false, featured: false },
  { name: "Specstack", shortDescription: "Turn a product idea into an executable spec.", fullDescription: "Specstack helps product teams move from a sharp idea to shared scope, decisions, and acceptance criteria.", websiteUrl: "https://specstack.example", categoryId: "developer-tools", pricingType: "Freemium", launchDate: "2026-08-07", makerName: "Marta K.", totalVotes: 231, totalClicks: 1180, totalQualifiedClicks: 1004, totalViews: 6500, bidCents: 1200, color: "#5B7CFF", tags: ["Product", "Planning"], verified: false, featured: false },
  { name: "Palette Pilot", shortDescription: "A color system that understands your brand voice.", fullDescription: "Palette Pilot gives teams a living palette with accessible variants, usage notes, and exportable tokens.", websiteUrl: "https://palettepilot.example", categoryId: "design", pricingType: "Paid", launchDate: "2026-08-06", makerName: "Inez Studio", totalVotes: 218, totalClicks: 1102, totalQualifiedClicks: 934, totalViews: 6100, bidCents: 1100, color: "#DB6AA6", tags: ["Brand", "Colors"], verified: false, featured: false },
  { name: "Signalpost", shortDescription: "Know which launch channels actually moved the needle.", fullDescription: "Signalpost turns campaign links into clear, source-level learning for small launch teams.", websiteUrl: "https://signalpost.example", categoryId: "marketing", pricingType: "Freemium", launchDate: "2026-08-05", makerName: "Fieldwork", totalVotes: 204, totalClicks: 1021, totalQualifiedClicks: 861, totalViews: 5700, bidCents: 1000, color: "#39A98D", tags: ["Analytics", "Launches"], verified: false, featured: false },
  { name: "Pocket Pantry", shortDescription: "Plan the week with the food you already have.", fullDescription: "Pocket Pantry makes a low-stress meal plan from your actual kitchen, not an aspirational grocery list.", websiteUrl: "https://pocketpantry.example", categoryId: "mobile-apps", pricingType: "Free", launchDate: "2026-08-04", makerName: "Mara Lin", totalVotes: 197, totalClicks: 980, totalQualifiedClicks: 841, totalViews: 5100, bidCents: 900, color: "#3C97C9", tags: ["Food", "Planning"], verified: false, featured: false },
  { name: "Commonplace", shortDescription: "A public notebook for teams who want to share the why.", fullDescription: "Commonplace makes decisions discoverable, searchable, and easier to hand to the next person.", websiteUrl: "https://commonplace.example", categoryId: "saas", pricingType: "Open source", launchDate: "2026-08-03", makerName: "Commonplace", totalVotes: 184, totalClicks: 902, totalQualifiedClicks: 792, totalViews: 4700, bidCents: 800, color: "#7254CA", tags: ["Knowledge", "Teams"], verified: true, featured: false },
  { name: "Kindred", shortDescription: "Find the people making the work you want to see.", fullDescription: "Kindred is a curated network for independent builders, with less noise and more useful introductions.", websiteUrl: "https://kindred.example", categoryId: "marketing", pricingType: "Free", launchDate: "2026-08-02", makerName: "Ana Torres", totalVotes: 176, totalClicks: 864, totalQualifiedClicks: 711, totalViews: 4400, bidCents: 700, color: "#39A98D", tags: ["Community", "Network"], verified: false, featured: false },
  { name: "Framewise", shortDescription: "A calmer way to critique work in progress.", fullDescription: "Framewise creates structured feedback rooms around the work itself, so critique stays useful and kind.", websiteUrl: "https://framewise.example", categoryId: "design", pricingType: "Freemium", launchDate: "2026-08-01", makerName: "Rae Cooper", totalVotes: 164, totalClicks: 821, totalQualifiedClicks: 689, totalViews: 4100, bidCents: 600, color: "#DB6AA6", tags: ["Feedback", "Design"], verified: false, featured: false },
  { name: "Ledgerly", shortDescription: "Invoices and runway for tiny studios.", fullDescription: "Ledgerly keeps the financial admin of an independent studio small, clear, and in one place.", websiteUrl: "https://ledgerly.example", categoryId: "finance", pricingType: "Paid", launchDate: "2026-07-31", makerName: "Amir Ross", totalVotes: 152, totalClicks: 786, totalQualifiedClicks: 641, totalViews: 3800, bidCents: 500, color: "#3E8E65", tags: ["Invoices", "Studios"], verified: false, featured: false },
  { name: "Buildlight", shortDescription: "A status page for the work behind the launch.", fullDescription: "Buildlight helps teams share progress without turning every update into a press release.", websiteUrl: "https://buildlight.example", categoryId: "developer-tools", pricingType: "Free", launchDate: "2026-07-30", makerName: "Drew & Co.", totalVotes: 141, totalClicks: 710, totalQualifiedClicks: 596, totalViews: 3500, bidCents: 400, color: "#5B7CFF", tags: ["Progress", "Build"], verified: false, featured: false },
  { name: "Softserve", shortDescription: "A gentle customer portal for independent services.", fullDescription: "Softserve gives service businesses a friendly place for onboarding, updates, files, and next steps.", websiteUrl: "https://softserve.example", categoryId: "saas", pricingType: "Paid", launchDate: "2026-07-29", makerName: "Sofi Mora", totalVotes: 131, totalClicks: 676, totalQualifiedClicks: 551, totalViews: 3200, bidCents: 300, color: "#7254CA", tags: ["Clients", "Services"], verified: false, featured: false },
  { name: "Maproom", shortDescription: "A map of the internet's smaller, stranger corners.", fullDescription: "Maproom is a hand-curated starting point for discovering independent tools and people.", websiteUrl: "https://maproom.example", categoryId: "open-source", pricingType: "Free", launchDate: "2026-07-28", makerName: "June Hall", totalVotes: 122, totalClicks: 641, totalQualifiedClicks: 520, totalViews: 2900, bidCents: 200, color: "#557A71", tags: ["Discovery", "Curated"], verified: false, featured: false },
  { name: "Focusfield", shortDescription: "A single-screen workspace for deep work days.", fullDescription: "Focusfield strips back the busywork so a meaningful block of time has somewhere to land.", websiteUrl: "https://focusfield.example", categoryId: "productivity", pricingType: "Free", launchDate: "2026-07-27", makerName: "Nils Ford", totalVotes: 113, totalClicks: 590, totalQualifiedClicks: 492, totalViews: 2700, bidCents: 100, color: "#E6A43D", tags: ["Focus", "Deep work"], verified: false, featured: false },
  { name: "Tinkerbox", shortDescription: "Tiny experiments, shared in public.", fullDescription: "Tinkerbox is a home for small internet experiments that do not need to become startups to be worth making.", websiteUrl: "https://tinkerbox.example", categoryId: "games", pricingType: "Free", launchDate: "2026-07-26", makerName: "The Tinkerbox club", totalVotes: 98, totalClicks: 522, totalQualifiedClicks: 442, totalViews: 2400, bidCents: 100, color: "#D55D52", tags: ["Experiments", "Play"], verified: false, featured: false },
  { name: "Draftday", shortDescription: "A little more courage for the first draft.", fullDescription: "Draftday helps writers turn an intimidating blank page into a small, scheduled practice.", websiteUrl: "https://draftday.example", categoryId: "education", pricingType: "Freemium", launchDate: "2026-07-25", makerName: "Bex Young", totalVotes: 92, totalClicks: 480, totalQualifiedClicks: 406, totalViews: 2100, bidCents: 100, color: "#D18C3C", tags: ["Writing", "Practice"], verified: false, featured: false },
  { name: "Parcel", shortDescription: "The simplest way to keep a project in motion.", fullDescription: "Parcel bundles the links, people, and decisions a project needs into a concise daily brief.", websiteUrl: "https://parcel.example", categoryId: "productivity", pricingType: "Paid", launchDate: "2026-07-24", makerName: "Samir N.", totalVotes: 80, totalClicks: 440, totalQualifiedClicks: 371, totalViews: 1800, bidCents: 100, color: "#E6A43D", tags: ["Projects", "Briefs"], verified: false, featured: false },
  { name: "Studio Morrow", shortDescription: "A tiny studio making beautiful useful things.", fullDescription: "Studio Morrow publishes thoughtful software, playful tools, and a small library of open experiments.", websiteUrl: "https://studiomorrow.example", categoryId: "design", pricingType: "Free", launchDate: "2026-07-23", makerName: "Morrow Studio", totalVotes: 75, totalClicks: 402, totalQualifiedClicks: 339, totalViews: 1600, bidCents: 100, color: "#DB6AA6", tags: ["Studio", "Independent"], verified: false, featured: false },
  { name: "Forage", shortDescription: "A tiny guide to the best corners of your city.", fullDescription: "Forage helps curious people find independent places, products, and gatherings through trusted local notes.", websiteUrl: "https://forage.example", categoryId: "mobile-apps", pricingType: "Free", launchDate: "2026-07-22", makerName: "Forage Studio", totalVotes: 68, totalClicks: 366, totalQualifiedClicks: 304, totalViews: 1450, bidCents: 100, color: "#3C97C9", tags: ["Local", "Discovery"], verified: false, featured: false },
];

export const products: Product[] = productSeeds.map((product, index) => ({
  ...product,
  id: `product-${index + 1}`,
  slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  ownerId: `owner-${(index % 8) + 1}`,
  status: "PUBLISHED",
  verified: product.verified ?? false,
  featured: product.featured ?? false,
  totalFavorites: product.totalFavorites ?? Math.round(product.totalVotes * 0.22),
  position: index + 1,
  previousPosition: index < 4 ? index + 2 : index + 1,
  trend: index < 4 ? "up" : index === 4 ? "new" : index % 4 === 0 ? "down" : "flat",
  makerCount: index % 7 === 0 ? 2 : 1,
}));

export const getProductBySlug = (slug: string) => products.find((product) => product.slug === slug);
export const getProductById = (id: string) => products.find((product) => product.id === id);
export const getCategoryBySlug = (slug: string) => categories.find((category) => category.slug === slug);

export const getCurrentRound = (): LeaderboardRound => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = addDays(start, 1);
  return {
    id: `brawl-${start.toISOString().slice(0, 10)}`,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    status: "ACTIVE",
    totalRevenueCents: products.reduce((sum, product) => sum + product.bidCents, 0),
    winningProductId: products[0]?.id,
    winningBidCents: products[0]?.bidCents,
  };
};

export const getLeaderboard = () => products.slice(0, 10).sort((a, b) => b.bidCents - a.bidCents).map((product, index) => ({ ...product, position: index + 1 }));

export const getTrendingProducts = () => [...products].sort((a, b) => {
  const aScore = calculateTrendingScore({ votes: a.totalVotes, qualifiedClicks: a.totalQualifiedClicks, favorites: a.totalFavorites, views: a.totalViews, ageHours: Math.max(2, (Date.now() - new Date(a.launchDate).getTime()) / 3_600_000) });
  const bScore = calculateTrendingScore({ votes: b.totalVotes, qualifiedClicks: b.totalQualifiedClicks, favorites: b.totalFavorites, views: b.totalViews, ageHours: Math.max(2, (Date.now() - new Date(b.launchDate).getTime()) / 3_600_000) });
  return bScore - aScore;
});

export const getNewProducts = () => [...products].sort((a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime());
export const getMostLovedProducts = () => [...products].sort((a, b) => b.totalVotes - a.totalVotes);

export const winnerHistory: Winner[] = [
  { id: "winner-1", date: "2026-08-21", productId: products[1].id, productName: products[1].name, productSlug: products[1].slug, winningBidCents: 14700, views: 28400, clicks: 3102, category: "Design", makerName: products[1].makerName },
  { id: "winner-2", date: "2026-08-20", productId: products[2].id, productName: products[2].name, productSlug: products[2].slug, winningBidCents: 13200, views: 23100, clicks: 2741, category: "Productivity", makerName: products[2].makerName },
  { id: "winner-3", date: "2026-08-19", productId: products[3].id, productName: products[3].name, productSlug: products[3].slug, winningBidCents: 11800, views: 19700, clicks: 2194, category: "Developer Tools", makerName: products[3].makerName },
  { id: "winner-4", date: "2026-08-18", productId: products[4].id, productName: products[4].name, productSlug: products[4].slug, winningBidCents: 9600, views: 16400, clicks: 1832, category: "Mobile Apps", makerName: products[4].makerName },
  { id: "winner-5", date: "2026-08-17", productId: products[5].id, productName: products[5].name, productSlug: products[5].slug, winningBidCents: 8900, views: 15100, clicks: 1594, category: "SaaS", makerName: products[5].makerName },
  { id: "winner-6", date: "2026-08-16", productId: products[6].id, productName: products[6].name, productSlug: products[6].slug, winningBidCents: 7600, views: 14200, clicks: 1398, category: "Marketing", makerName: products[6].makerName },
];

export const brawls: Brawl[] = [
  { id: "brawl-1", prompt: "Which launch would you send to a friend?", leftProductId: products[8].id, rightProductId: products[14].id, leftVotes: 612, rightVotes: 488, endsAt: addDays(new Date(), 1).toISOString(), status: "LIVE" },
  { id: "brawl-2", prompt: "Which tool deserves a spot in your stack?", leftProductId: products[7].id, rightProductId: products[11].id, leftVotes: 341, rightVotes: 397, endsAt: addDays(new Date(), 2).toISOString(), status: "LIVE" },
  { id: "brawl-3", prompt: "Which one would you launch first?", leftProductId: products[12].id, rightProductId: products[17].id, leftVotes: 228, rightVotes: 199, endsAt: addDays(new Date(), 3).toISOString(), status: "UPCOMING" },
];

export const demoCampaigns: Campaign[] = [
  { id: "campaign-1", bidId: "bid-1", productId: products[0].id, productName: products[0].name, status: "ACTIVE", purchasedAmountCents: 8400, purchasedImpressions: 1680, deliveredImpressions: 1120, qualifiedImpressions: 1042, remainingImpressions: 638, clicks: 132, qualifiedClicks: 118, startedAt: "2026-08-22T03:00:00Z", expiresAt: addDays(new Date(), 4).toISOString() },
  { id: "campaign-2", bidId: "bid-2", productId: products[1].id, productName: products[1].name, status: "COMPLETED", purchasedAmountCents: 6200, purchasedImpressions: 1240, deliveredImpressions: 1240, qualifiedImpressions: 1181, remainingImpressions: 59, clicks: 101, qualifiedClicks: 94, startedAt: "2026-08-20T02:00:00Z", expiresAt: "2026-08-21T02:00:00Z" },
  { id: "campaign-3", bidId: "bid-3", productId: products[2].id, productName: products[2].name, status: "ACTIVE", purchasedAmountCents: 5100, purchasedImpressions: 1020, deliveredImpressions: 704, qualifiedImpressions: 662, remainingImpressions: 358, clicks: 67, qualifiedClicks: 59, startedAt: "2026-08-21T02:00:00Z", expiresAt: addDays(new Date(), 2).toISOString() },
];

export const getProductsForCategory = (slug: string) => {
  const category = getCategoryBySlug(slug);
  return category ? products.filter((product) => product.categoryId === category.id) : [];
};
