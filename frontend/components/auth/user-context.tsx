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
};

// コンテクストの値の型定義、読む、保存、APIから保存、消すの役割を持つ。
type UserContextValue = {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  setUserFromApi: (payload: unknown) => void;
  logout: () => void;
};

// ローカルストレージのキー
const STORAGE_KEY = "ft_transcendence.user";

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

  return { uuid, display_name: displayName, avatar_url: avatarUrl };
}

// いまのログイン状態を保存する、ここらの処理の中心部分
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);

  // 初回ロード時にローカルストレージからユーザー情報を復元
  useEffect(() => {
    // 1 . ローカルストレージからデータを取得
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      // 2 . JSONとして、パース
      const parsed = JSON.parse(raw) as unknown;
      // 3 . 安全性を確認して、正規化
      const normalized = normalizeUser(parsed);
      if (normalized) {
        // 4 .　問題なければ、状態にセット
        setUserState(normalized);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // stateとローカルストレージの両方を更新する関数　ユーザーがあれば保存、なければ削除
  // 状態だけ変わるとか、保存だけ変わるのようなことがないようにする。
  // useCallbackでメモ化して、依存関係が変わらない限り同じ関数を使うようにする。
  const setUser = useCallback((next: UserProfile | null) => {
    setUserState(next);
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
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

  // ログアウトの処理を1箇所にまとめる
  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  // コンテクストの値をメモ化して、不要な再レンダリングを防ぐ
  const value = useMemo(
    () => ({ user, setUser, setUserFromApi, logout }),
    [user, setUser, setUserFromApi, logout],
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
