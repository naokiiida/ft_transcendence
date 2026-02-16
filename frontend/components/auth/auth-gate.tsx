"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/auth/user-context";

interface AuthGateProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGate({ children, redirectTo = "/login" }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const query = searchParams?.toString();
      const fullPath = pathname && query ? `${pathname}?${query}` : pathname ?? "";
      const next = fullPath ? encodeURIComponent(fullPath) : "";
      const target = next ? `${redirectTo}?next=${next}` : redirectTo;
      router.replace(target);
    }
  }, [isLoading, isAuthenticated, redirectTo, router, pathname, searchParams]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
        <p className="text-sm text-muted-foreground">認証を確認しています...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
