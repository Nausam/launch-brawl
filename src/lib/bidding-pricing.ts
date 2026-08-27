// These are the exact one-off USD bid amounts offered through Freemius.
// `quota` remains the Freemius tier selector; it is not a reach-unit count.
export const FREEMIUS_BID_PACKAGES = [
  { quota: 3, amountCents: 300 },
  { quota: 5, amountCents: 500 },
  { quota: 10, amountCents: 1_000 },
  { quota: 15, amountCents: 1_500 },
  { quota: 20, amountCents: 2_000 },
  { quota: 25, amountCents: 2_500 },
  { quota: 30, amountCents: 3_000 },
  { quota: 35, amountCents: 3_500 },
  { quota: 40, amountCents: 4_000 },
  { quota: 45, amountCents: 4_500 },
  { quota: 50, amountCents: 5_000 },
  { quota: 55, amountCents: 5_500 },
  { quota: 60, amountCents: 6_000 },
  { quota: 65, amountCents: 6_500 },
  { quota: 70, amountCents: 7_000 },
  { quota: 75, amountCents: 7_500 },
  { quota: 80, amountCents: 8_000 },
  { quota: 85, amountCents: 8_500 },
  { quota: 90, amountCents: 9_000 },
  { quota: 95, amountCents: 9_500 },
  { quota: 100, amountCents: 10_000 },
  { quota: 150, amountCents: 15_000 },
  { quota: 200, amountCents: 20_000 },
  { quota: 250, amountCents: 25_000 },
  { quota: 300, amountCents: 30_000 },
  { quota: 350, amountCents: 35_000 },
  { quota: 400, amountCents: 40_000 },
  { quota: 450, amountCents: 45_000 },
  { quota: 500, amountCents: 50_000 },
] as const;

export type FreemiusBidQuota = (typeof FREEMIUS_BID_PACKAGES)[number]["quota"];

export function bidAmountForQuota(quota: number) {
  return FREEMIUS_BID_PACKAGES.find((candidate) => candidate.quota === quota)?.amountCents ?? 0;
}

export function quotaForBidAmount(amountCents: number): FreemiusBidQuota | null {
  return FREEMIUS_BID_PACKAGES.find((candidate) => candidate.amountCents === amountCents)?.quota ?? null;
}

export function nextFreemiusBidCents(
  currentHighestCents: number,
  minimumBidCents = 100,
  minimumIncrementCents = 100,
) {
  const target = Math.max(minimumBidCents, currentHighestCents + minimumIncrementCents);
  return FREEMIUS_BID_PACKAGES.find(({ amountCents }) => amountCents >= target)?.amountCents ?? null;
}

export function supportedFreemiusBidOptions(currentHighestCents: number, maximumBidCents = Number.MAX_SAFE_INTEGER) {
  const minimumCents = nextFreemiusBidCents(currentHighestCents) ?? Number.MAX_SAFE_INTEGER;
  return FREEMIUS_BID_PACKAGES.filter(({ amountCents }) => amountCents >= minimumCents && amountCents <= maximumBidCents);
}
