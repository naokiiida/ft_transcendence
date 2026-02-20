import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const NORMALIZED_API_BASE = API_BASE.replace(/\/$/, "");
const DEFAULT_WS_BASE = `${NORMALIZED_API_BASE.replace(/^http/, "ws")}/api/ws`;
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_BASE;

/**
 * 相対APIパス（/api/...）をバックエンドの完全URLに解決する。
 * ローカル開発ではフロントエンド(3000)とバックエンド(3001)が別ポートなので必要。
 * Docker/Traefik環境では同一オリジンだが、完全URLでも問題なく動作する。
 */
export function resolveApiUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}
