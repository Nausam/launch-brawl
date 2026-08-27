import { describe, expect, it } from "vitest";
import { getCurrentRound } from "@/lib/data";
import { validateBid } from "@/lib/server/bidding";

describe("bid validation", () => {
  const round = getCurrentRound();
  it("rejects an inactive round", () => { const result = validateBid({ amountCents: 10_000, currentHighestCents: 100, round: { ...round, status: "COMPLETED" } }); expect(result.valid).toBe(false); });
  it("rejects bids below the authoritative minimum", () => { const result = validateBid({ amountCents: 4200, currentHighestCents: 4200, round }); expect(result.valid).toBe(false); });
  it("starts at the first supported dollar amount", () => { const result = validateBid({ amountCents: 300, currentHighestCents: 0, round }); expect(result.valid).toBe(true); });
  it("returns a promo allocation for a valid Freemius bid amount", () => { const result = validateBid({ amountCents: 7500, currentHighestCents: 4200, round }); expect(result.valid).toBe(true); if (result.valid) expect(result.purchasedImpressions).toBe(1500); });
});
