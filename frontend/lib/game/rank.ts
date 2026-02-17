export type RankLabel = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export type RankTier = {
  label: RankLabel;
  min: number;
};

export const rankTiers: RankTier[] = [
  { label: "Bronze", min: 0 },
  { label: "Silver", min: 50 },
  { label: "Gold", min: 100 },
  { label: "Platinum", min: 150 },
  { label: "Diamond", min: 200 },
];

export function getRankForScore(value: number): RankTier {
  let current = rankTiers[0];
  for (const tier of rankTiers) {
    if (value >= tier.min) current = tier;
  }
  return current;
}
