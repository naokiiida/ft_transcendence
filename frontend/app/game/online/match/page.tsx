"use client";

import { AuthGate } from "@/components/auth/auth-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnlineMatchPage() {
  return (
    <AuthGate>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <h1 className="text-2xl font-semibold">オンライン対戦</h1>
        <Card className="min-h-[360px]">
          <CardHeader>
            <CardTitle>マッチ開始</CardTitle>
          </CardHeader>
          <CardContent className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            <p>ここにオンライン対戦のゲーム画面が表示されます。</p>
          </CardContent>
        </Card>
      </div>
    </AuthGate>
  );
}
