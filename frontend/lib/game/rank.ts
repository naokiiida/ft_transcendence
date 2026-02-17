export type RankLabel = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export type RankTier = {
  label: RankLabel;
  min: number;
};

export const rankTiers: RankTier[] = [
  { label: "Bronze", min: 0 },
  { label: "Silver", min: 100 },
  { label: "Gold", min: 200 },
  { label: "Platinum", min: 300 },
  { label: "Diamond", min: 450 },
];

export function getRankForScore(value: number): RankTier {
  let current = rankTiers[0];
  for (const tier of rankTiers) {
    if (value >= tier.min) current = tier;
  }
  return current;
}
