import { describe, expect, it } from "vitest";
import {
  calculateBrawlMetrics,
  calculateBrawlRatingChange,
  calculateDailyPickScore,
  calculateExpectedScore,
  calculateSeasonPoints,
  calculateTastemakerScore,
  calculateWinRate,
  canBecomeBoss,
  getDailyQuestInstances,
  getLeagueDivision,
  getLevelForXp,
  isPredictionLocked,
  isUpset,
  updateWinLossStreaks,
} from "@/lib/server/gamification";

describe("Brawl rating", () => {
  it("uses expected score and preserves zero-sum Elo", () => {
    const expected = calculateExpectedScore(1000, 1400);
    const result = calculateBrawlRatingChange({ ratingA: 1000, ratingB: 1400, result: "A_WIN" });
    expect(expected).toBeLessThan(0.1);
    expect(result.deltaA + result.deltaB).toBe(0);
    expect(result.deltaA).toBeGreaterThan(20);
  });

  it("handles draws without inflating ratings", () => {
    const result = calculateBrawlRatingChange({ ratingA: 1200, ratingB: 1200, result: "DRAW" });
    expect(result.deltaA).toBe(0);
    expect(result.deltaB).toBe(0);
  });

  it("flags a meaningful upset rather than every underdog result", () => {
    expect(isUpset({ winnerRating: 900, loserRating: 1450, expectedWinnerProbability: 0.04 })).toBe(true);
    expect(isUpset({ winnerRating: 1120, loserRating: 1180, expectedWinnerProbability: 0.42 })).toBe(false);
  });
});

describe("Brawl progression", () => {
  it("breaks both streaks on a draw", () => {
    expect(updateWinLossStreaks({ currentWinStreak: 4, longestWinStreak: 5, currentLossStreak: 2, longestLossStreak: 3 }, "DRAW")).toEqual({ currentWinStreak: 0, longestWinStreak: 5, currentLossStreak: 0, longestLossStreak: 3 });
  });

  it("calculates a percentage win rate with draws worth half", () => {
    expect(calculateWinRate(7, 2, 1)).toBe(75);
  });

  it("centralizes season points and level thresholds", () => {
    expect(calculateSeasonPoints({ result: "A_WIN", upset: true, bossWin: true, resultingWinStreak: 5 })).toBe(29);
    expect(getLevelForXp(4_200)).toMatchObject({ level: 20, title: "Tastemaker" });
    expect(getLeagueDivision(1_405)).toBe("DIAMOND");
  });

  it("generates deterministic daily quests", () => {
    const date = new Date("2026-08-22T12:00:00.000Z");
    expect(getDailyQuestInstances(date)).toEqual(getDailyQuestInstances(date));
    expect(getDailyQuestInstances(date).every((quest) => quest.id.startsWith("2026-08-22_"))).toBe(true);
  });
});

describe("Community gamification", () => {
  it("detects close Brawls only after the minimum vote floor", () => {
    expect(calculateBrawlMetrics({ leftVotes: 50, rightVotes: 49 }).isClose).toBe(true);
    expect(calculateBrawlMetrics({ leftVotes: 3, rightVotes: 3 }).isClose).toBe(false);
  });

  it("locks predictions in the final stretch", () => {
    const startsAt = "2026-08-22T00:00:00.000Z";
    const endsAt = "2026-08-23T00:00:00.000Z";
    expect(isPredictionLocked({ startsAt, endsAt, now: new Date("2026-08-22T18:00:00.000Z") })).toBe(false);
    expect(isPredictionLocked({ startsAt, endsAt, now: new Date("2026-08-22T20:00:00.000Z") })).toBe(true);
  });

  it("rewards organic early discovery with diminishing returns", () => {
    const early = calculateTastemakerScore({ votesAtSupport: 12, currentOrganicVotes: 1400, currentTrendingRank: 2, brawlWinsAfterSupport: 2, daysSinceSupport: 3, dailyEarlySupports: 2 });
    const spammy = calculateTastemakerScore({ votesAtSupport: 12, currentOrganicVotes: 1400, currentTrendingRank: 2, brawlWinsAfterSupport: 2, daysSinceSupport: 3, dailyEarlySupports: 12 });
    expect(early).toBeGreaterThan(spammy);
  });

  it("scores picks without any monetary input", () => {
    expect(calculateDailyPickScore([{ points: 58 }, { points: 42 }, { points: 24 }])).toBe(124);
    expect(canBecomeBoss({ rating: 1300, totalBrawls: 6, provisionalBrawls: 2 })).toBe(true);
  });
});
