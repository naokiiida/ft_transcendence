/**
 * Authentication Context for React
 *
 * Provides user state and auth actions to the entire app through React Context.
 * Supports both 42 OAuth and local email/password authentication.
 * Uses the /auth/me endpoint to check authentication status on app load.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthMethod = "oauth42" | "local";

export interface User {
  id: number;
  login: string;
  displayName: string;
  email: string;
  imageUrl: string;
  authMethod?: AuthMethod;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthError {
  error: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // 42 OAuth login
  loginWith42: () => void;
  // Local email/password auth
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch("/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const loginWith42 = () => {
    // Redirect to backend auth endpoint which initiates 42 OAuth flow
    window.location.href = "/auth/login";
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
        return { success: true };
      }

      return { success: false, error: result.error || "Registration failed" };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const loginWithEmail = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/auth/local/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
        return { success: true };
      }

      return { success: false, error: result.error || "Login failed" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = () => {
    // Redirect to backend logout endpoint
    window.location.href = "/auth/logout";
  };

  const refresh = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        loginWith42,
        register,
        loginWithEmail,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
