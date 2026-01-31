"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/components/auth/user-context";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    // ログインユーザーの情報をどこでも読めるようにする。
    <UserProvider>
      {/* ツールチップのコンテクストを提供する。 */}
      <TooltipProvider>{children}</TooltipProvider>
    </UserProvider>
  );
}
