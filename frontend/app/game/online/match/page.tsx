import { Suspense } from "react";
import { OnlineMatchClient } from "./online-match-client";

// 常に動的レンダリング（query string に依存するため）
export const dynamic = "force-dynamic";

export default function OnlineMatchPage() {
  // searchParams を使うので Suspense で包む
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
          <p className="text-sm text-muted-foreground">ロード中...</p>
        </div>
      }
    >
      <OnlineMatchClient />
    </Suspense>
  );
}
