import { describe, expect, it } from "vitest";
import { calculateCampaignImpressions, calculateCpc, calculateCtr, calculateMinimumBid, calculateTrendingScore, formatMoney, productIconCandidates, selectRoundWinner } from "@/lib/utils";

describe("Launch Brawl money and campaign utilities", () => {
  it("formats integer cents without floating point surprises", () => { expect(formatMoney(124_000)).toBe("$1,240"); expect(formatMoney(100)).toBe("$1"); });
  it("calculates the next valid bid", () => { expect(calculateMinimumBid(4200)).toBe(4300); expect(calculateMinimumBid(0)).toBe(100); });
  it("allocates configurable promotional impressions", () => { expect(calculateCampaignImpressions(5000, 20)).toBe(1000); expect(calculateCampaignImpressions(2550, 20)).toBe(510); });
  it("calculates CTR and CPC from qualified events", () => { expect(calculateCtr(100, 1000)).toBe(10); expect(calculateCpc(3200, 400)).toBe(8); expect(calculateCtr(0, 0)).toBe(0); });
});

describe("Launch Brawl ranking utilities", () => {
  it("applies time decay to trending engagement", () => { const fresh = calculateTrendingScore({ votes: 100, qualifiedClicks: 100, favorites: 20, views: 1000, ageHours: 4 }); const old = calculateTrendingScore({ votes: 100, qualifiedClicks: 100, favorites: 20, views: 1000, ageHours: 96 }); expect(fresh).toBeGreaterThan(old); });
  it("selects the highest bid as round winner", () => { expect(selectRoundWinner([{ id: "a", bidCents: 100 }, { id: "b", bidCents: 250 }])?.id).toBe("b"); });
});

describe("product icons", () => {
  it("uses the stored logo first, then a public favicon fallback", () => {
    expect(productIconCandidates({
      logoUrl: "https://citereadyai.com/favicon.ico",
      websiteUrl: "https://citereadyai.com",
    })).toEqual([
      "https://citereadyai.com/favicon.ico",
      "https://www.google.com/s2/favicons?sz=128&domain=citereadyai.com",
    ]);
  });

  it("keeps seed placeholders on example hosts", () => {
    expect(productIconCandidates({ websiteUrl: "https://supaai.example" })).toEqual([]);
  });
});
