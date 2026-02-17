import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ft_ball_color_by_rank";

export function getBallColorByRankEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function setBallColorByRankEnabled(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
}

export function useBallColorByRankEnabled() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(getBallColorByRankEnabled());
  }, []);

  const update = useCallback((value: boolean) => {
    setEnabled(value);
    setBallColorByRankEnabled(value);
  }, []);

  return [enabled, update] as const;
}
