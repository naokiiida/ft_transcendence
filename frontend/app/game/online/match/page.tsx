import { Suspense } from "react";
import { OnlineMatchClient } from "./online-match-client";

export default function OnlineMatchPage() {
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
