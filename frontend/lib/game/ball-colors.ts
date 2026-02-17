import type { RankLabel } from "./rank";

export const BALL_COLOR_BY_RANK: Record<RankLabel, string> = {
  Bronze: "#cd7f32",
  Silver: "#c0c0c0",
  Gold: "#f6d365",
  Platinum: "#7dd3c7",
  Diamond: "#7dd3fc",
};

export function getBallColorForRank(label: RankLabel): string {
  return BALL_COLOR_BY_RANK[label];
}
