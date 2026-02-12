"use client";

import { useEffect, useState } from "react";
import { MatchmakingQueue } from "@/components/game/matchmaking-queue";
import { GameStatus } from "@/components/game/game-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGate } from "@/components/auth/auth-gate";

export default function OnlineGamePage() {
  const [isSearching, setIsSearching] = useState(true);
  const [queueTime, setQueueTime] = useState(0);

  useEffect(() => {
    if (!isSearching) return;
    const timer = setInterval(() => {
      setQueueTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSearching]);

  const handleCancel = () => {
    setIsSearching(false);
  };

  return (
    <AuthGate>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">オンライン対戦</h1>
            <p className="text-sm text-muted-foreground">
              マッチング待機中はステータスが表示されます。
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsSearching(true)}>
            再検索
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <MatchmakingQueue
            isSearching={isSearching}
            queueTime={queueTime}
            playersInQueue={12}
            onCancel={handleCancel}
          />

          <Card className="relative min-h-[360px] overflow-hidden">
            <CardHeader>
              <CardTitle>ゲーム画面</CardTitle>
            </CardHeader>
            <CardContent className="relative flex h-72 items-center justify-center text-sm text-muted-foreground">
              <p>ここにゲームキャンバスが表示されます。</p>
              <GameStatus
                state={isSearching ? "waiting" : "countdown"}
                message={isSearching ? "対戦相手を検索中..." : undefined}
                countdown={isSearching ? undefined : 3}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGate>
  );
}
