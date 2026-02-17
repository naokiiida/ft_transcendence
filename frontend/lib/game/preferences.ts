import { useCallback, useEffect, useState } from "react";

// localStorage に保存するキー名。
const STORAGE_KEY = "ft_ball_color_by_rank";

export function getBallColorByRankEnabled(): boolean {
  // SSR時は window が無いので、デフォルトを返す。
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  // 未保存の場合はデフォルトで有効。
  if (raw === null) return true;
  return raw === "1";
}

export function setBallColorByRankEnabled(value: boolean): void {
  // SSR時は localStorage に触れない。
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
}

export function useBallColorByRankEnabled() {
  // UI側が使うフック。内部で localStorage と同期する。
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    // 初回マウント時に localStorage の値を反映。
    setEnabled(getBallColorByRankEnabled());
  }, []);

  const update = useCallback((value: boolean) => {
    // state と localStorage を両方更新。
    setEnabled(value);
    setBallColorByRankEnabled(value);
  }, []);

  return [enabled, update] as const;
}
