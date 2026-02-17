import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// className を安全に結合するユーティリティ（条件付きクラス対応）。
export function cn(...inputs: ClassValue[]) {
  // clsx で条件付き結合 → twMerge で Tailwind の競合を解消。
  return twMerge(clsx(inputs));
}

// API のベースURL。環境変数が無い場合はローカルのバックエンドを使う。
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * 相対APIパス（/api/...）をバックエンドの完全URLに解決する。
 * ローカル開発ではフロントエンド(3000)とバックエンド(3001)が別ポートなので必要。
 * Docker/Traefik環境では同一オリジンだが、完全URLでも問題なく動作する。
 */
export function resolveApiUrl(path: string | null | undefined): string | undefined {
  // null/undefined/空文字はそのまま返す（呼び出し元の分岐に任せる）。
  if (!path) return undefined;
  // すでに絶対URLならそのまま返す。
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // 相対パスなら API_BASE を付けて絶対URLにする。
  return `${API_BASE}${path}`;
}
