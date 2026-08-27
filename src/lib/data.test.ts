import { describe, expect, it } from "vitest";
import { categories, getLeaderboard, getProductBySlug, products } from "@/lib/data";

describe("seeded Launch Brawl directory", () => {
  it("contains a populated demo directory and category taxonomy", () => { expect(products.length).toBeGreaterThanOrEqual(30); expect(categories.length).toBeGreaterThanOrEqual(10); });
  it("uses stable slugs and produces a bid-ordered board", () => { expect(getProductBySlug("supaai")?.name).toBe("SupaAI"); const board = getLeaderboard(); expect(board[0].bidCents).toBeGreaterThanOrEqual(board[1].bidCents); });
});
