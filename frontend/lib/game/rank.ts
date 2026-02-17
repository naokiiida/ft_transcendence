// 表示用のランク名。文字列リテラルで型を絞ってミスを防ぐ。
export type RankLabel = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

// ランクの閾値設定（min 以上ならそのランク）。
export type RankTier = {
  label: RankLabel;
  min: number;
};

// 低い順に並べる前提のテーブル。
export const rankTiers: RankTier[] = [
  { label: "Bronze", min: 0 },
  { label: "Silver", min: 50 },
  { label: "Gold", min: 100 },
  { label: "Platinum", min: 150 },
  { label: "Diamond", min: 200 },
];

export function getRankForScore(value: number): RankTier {
  // もっとも高い条件に合うランクを探す。
  let current = rankTiers[0];
  for (const tier of rankTiers) {
    if (value >= tier.min) current = tier;
  }
  return current;
}
