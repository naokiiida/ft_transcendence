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

type UserProfile = {
  uuid: string | null;
  display_name: string;
  avatar_url: string | null;
};

type UserContextValue = {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  setUserFromApi: (payload: unknown) => void;
  logout: () => void;
};

const STORAGE_KEY = "ft_transcendence.user";

const UserContext = createContext<UserContextValue | undefined>(undefined);

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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const normalized = normalizeUser(parsed);
      if (normalized) {
        setUserState(normalized);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setUser = useCallback((next: UserProfile | null) => {
    setUserState(next);
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setUserFromApi = useCallback(
    (payload: unknown) => {
      const normalized = normalizeUser(payload);
      if (normalized) {
        setUser(normalized);
      }
    },
    [setUser]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const value = useMemo(
    () => ({ user, setUser, setUserFromApi, logout }),
    [user, setUser, setUserFromApi, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
