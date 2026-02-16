"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ユーザーコンテクストなので、認証情報を入れない。
type UserProfile = {
  uuid: string | null;
  display_name: string;
  avatar_url: string | null;
  wins: number;
  losses: number;
  user_score: number;
};

// コンテクストの値の型定義、読む、保存、APIから保存、消すの役割を持つ。
type UserContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setUserFromApi: (payload: unknown) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};


// コンテクストの作成、プロパイダーなしで使われた場合に備える。
const UserContext = createContext<UserContextValue | undefined>(undefined);

// 表示できないデータをそのまま使わないように、正規化関数を作成
function normalizeUser(payload: unknown): UserProfile | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as Record<string, unknown>;
  const displayName =
    typeof candidate.display_name === "string" ? candidate.display_name : null;
  if (!displayName) return null;

  const uuid = typeof candidate.uuid === "string" ? candidate.uuid : null;
  const avatarUrl =
    typeof candidate.avatar_url === "string" ? candidate.avatar_url : null;
  const wins =
    typeof candidate.wins === "number" && Number.isFinite(candidate.wins)
      ? candidate.wins
      : 0;
  const losses =
    typeof candidate.losses === "number" && Number.isFinite(candidate.losses)
      ? candidate.losses
      : 0;
  const userScore =
    typeof candidate.user_score === "number" && Number.isFinite(candidate.user_score)
      ? candidate.user_score
      : 0;

  return {
    uuid,
    display_name: displayName,
    avatar_url: avatarUrl,
    wins,
    losses,
    user_score: userScore,
  };
}

// いまのログイン状態を保存する、ここらの処理の中心部分
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // stateとローカルストレージの両方を更新する関数　ユーザーがあれば保存、なければ削除
  // 状態だけ変わるとか、保存だけ変わるのようなことがないようにする。
  // useCallbackでメモ化して、依存関係が変わらない限り同じ関数を使うようにする。
  const setUser = useCallback((next: UserProfile | null) => {
    setUserState(next);
  }, []);

  // APIレスポンスを直接信用せず、検査したものだけを保存する関数
  const setUserFromApi = useCallback(
    (payload: unknown) => {
      const normalized = normalizeUser(payload);
      if (normalized) {
        setUser(normalized);
      }
    },
    [setUser],
  );

  // /api/me のレスポンスを判定してユーザー状態を更新するヘルパー
  const handleMeResponse = useCallback(
    (response: Response) => {
      if (!response.ok) {
        setUser(null);
        return;
      }
      (response.json() as Promise<unknown>).then((payload) => {
        if (
          payload &&
          typeof payload === "object" &&
          "guest" in payload &&
          (payload as Record<string, unknown>).guest === true
        ) {
          setUser(null);
        } else {
          setUserFromApi(payload);
        }
      });
    },
    [setUser, setUserFromApi],
  );

  // 既にログイン済みの場合はサーバーから復元する
  // ブラウザに残ってるクッキーを使って、サーバーから本人確認を行う
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    fetch(`${apiBase}/api/me`, { credentials: "include" })
      .then(handleMeResponse)
      .catch(() => setUser(null))
      .finally(() => {
        setIsLoading(false);
      });
  }, [handleMeResponse, setUser]);

  const refreshUser = useCallback(async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/me`, {
        credentials: "include",
      });
      handleMeResponse(response);
    } catch {
      // ignore fetch errors
    } finally {
      setIsLoading(false);
    }
  }, [handleMeResponse]);

  // ログアウトの処理を1箇所にまとめる
  const logout = useCallback(() => {
    // フロントエンド側の状態をクリア
    setUser(null);
    setIsLoading(false);
  }, [setUser]);

  // コンテクストの値をメモ化して、不要な再レンダリングを防ぐ
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      setUser,
      setUserFromApi,
      logout,
      refreshUser,
    }),
    [user, isLoading, setUser, setUserFromApi, logout, refreshUser],
  );

  // コンポーネントツリーにコンテクストの値を提供
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// もしコンテクストがプロバイダーなしで使われた場合にエラーを投げることで安全に使う。
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
