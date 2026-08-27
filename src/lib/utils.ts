import { formatDistanceToNow } from "date-fns";

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

export const formatMoney = (cents: number, options: { compact?: boolean } = {}) => {
  if (options.compact && cents >= 100_000) {
    return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
};

export const formatCompact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return value.toLocaleString("en-US");
};

export const formatPercent = (value: number) => `${value.toFixed(value < 10 ? 1 : 0)}%`;

export const relativeTime = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const calculateMinimumBid = (currentHighestCents: number, minimumBidCents = 100, minimumIncrementCents = 100) =>
  Math.max(minimumBidCents, currentHighestCents + minimumIncrementCents);

export const calculateCampaignImpressions = (amountCents: number, impressionsPerDollar = 20) =>
  Math.floor((amountCents / 100) * impressionsPerDollar);

export const calculateCtr = (clicks: number, impressions: number) => (impressions > 0 ? (clicks / impressions) * 100 : 0);

export const calculateCpc = (amountCents: number, clicks: number) => (clicks > 0 ? amountCents / clicks : 0);

export const calculateTrendingScore = (input: {
  votes: number;
  qualifiedClicks: number;
  favorites: number;
  views: number;
  ageHours: number;
  weights?: Partial<Record<"votes" | "qualifiedClicks" | "favorites" | "views", number>>;
}) => {
  const weights = { votes: 5, qualifiedClicks: 3, favorites: 4, views: 0.15, ...input.weights };
  const engagement = input.votes * weights.votes + input.qualifiedClicks * weights.qualifiedClicks + input.favorites * weights.favorites + input.views * weights.views;
  return engagement / Math.pow(input.ageHours + 2, 1.15);
};

export const selectRoundWinner = <T extends { bidCents: number }>(entries: T[]) => [...entries].sort((a, b) => b.bidCents - a.bidCents)[0];

export const isValidOutboundUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function isPublicProductHost(hostname: string) {
  const host = hostname.toLowerCase();
  return Boolean(host) && host !== "localhost" && !host.endsWith(".localhost") && !host.endsWith(".local") && !host.endsWith(".example");
}

export function productIconCandidates(product: { logoUrl?: string; websiteUrl?: string }) {
  const urls: string[] = [];
  const add = (value?: string) => {
    if (!value || !isValidOutboundUrl(value) || urls.includes(value)) return;
    urls.push(value);
  };

  add(product.logoUrl);

  if (product.websiteUrl) {
    try {
      const parsed = new URL(product.websiteUrl);
      if (isPublicProductHost(parsed.hostname)) {
        add(`https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(parsed.hostname)}`);
      }
    } catch {
      return urls;
    }
  }

  return urls;
}

export const truncate = (value: string, length: number) => (value.length > length ? `${value.slice(0, length - 1).trimEnd()}…` : value);
