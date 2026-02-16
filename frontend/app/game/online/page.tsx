"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MatchmakingQueue } from "@/components/game/matchmaking-queue";
import { GameStatus } from "@/components/game/game-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGate } from "@/components/auth/auth-gate";

type MatchmakingStatus = {
  in_queue: boolean;
  players_in_queue: number;
  queued_at: number | null;
  matched: boolean;
  matched_at: number | null;
  match_id: string | null;
  side: "left" | "right" | null;
};

type MatchPhase = "waiting" | "matched_notice" | "countdown" | "matched";

const MATCHED_NOTICE_SECONDS = 2;
const COUNTDOWN_SECONDS = 3;

export default function OnlineGamePage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const [isSearching, setIsSearching] = useState(true);
  const [isMatched, setIsMatched] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueTime, setQueueTime] = useState(0);
  const [queuedAt, setQueuedAt] = useState<number | null>(null);
  const [playersInQueue, setPlayersInQueue] = useState(0);
  const [phase, setPhase] = useState<MatchPhase>("waiting");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [matchedAt, setMatchedAt] = useState<number | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  const applyStatus = useCallback((status: MatchmakingStatus) => {
    setIsSearching(status.in_queue);
    setIsMatched(status.matched);
    setPlayersInQueue(status.players_in_queue);
    setQueuedAt(status.queued_at);
    setMatchedAt(status.matched_at);
    setMatchId(status.match_id);
    if (status.queued_at) {
      setQueueTime(Math.floor((Date.now() - status.queued_at) / 1000));
    } else {
      setQueueTime(0);
    }
    if (!status.in_queue && !status.matched) {
      setPhase("waiting");
      setCountdown(COUNTDOWN_SECONDS);
      setMatchedAt(null);
      setMatchId(null);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/matchmaking/status`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("ステータス取得に失敗しました");
    }
    const data = (await response.json()) as MatchmakingStatus;
    applyStatus(data);
  }, [apiBase, applyStatus]);

  const joinQueue = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/matchmaking/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("マッチング参加に失敗しました");
      }
      const data = (await response.json()) as MatchmakingStatus;
      applyStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーです");
      setIsSearching(false);
    } finally {
      setIsBusy(false);
    }
  }, [apiBase, applyStatus]);

  const leaveQueue = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/matchmaking/leave`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("マッチング離脱に失敗しました");
      }
      const data = (await response.json()) as MatchmakingStatus;
      applyStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーです");
    } finally {
      setIsBusy(false);
    }
  }, [apiBase, applyStatus]);

  useEffect(() => {
    if (!isSearching) return;
    const timer = setInterval(() => {
      if (queuedAt) {
        setQueueTime(Math.floor((Date.now() - queuedAt) / 1000));
      } else {
        setQueueTime((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isSearching, queuedAt]);

  useEffect(() => {
    void joinQueue();
  }, [joinQueue]);

  useEffect(() => {
    if (!isSearching) return;
    const poll = setInterval(() => {
      void fetchStatus().catch(() => {
        // polling errors are non-fatal; next poll will retry
      });
    }, 5000);
    return () => clearInterval(poll);
  }, [isSearching, fetchStatus]);

  useEffect(() => {
    if (!isMatched || !matchedAt) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - matchedAt) / 1000);
      if (elapsed < MATCHED_NOTICE_SECONDS) {
        setPhase("matched_notice");
        setCountdown(COUNTDOWN_SECONDS);
        return;
      }
      const countdownElapsed = elapsed - MATCHED_NOTICE_SECONDS;
      const remaining = Math.max(0, COUNTDOWN_SECONDS - countdownElapsed);
      if (remaining > 0) {
        setPhase("countdown");
        setCountdown(remaining);
        return;
      }
      setPhase("matched");
      setCountdown(0);
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [isMatched, matchedAt]);

  useEffect(() => {
    if (phase !== "matched") return;
    if (!matchId) return;
    const timer = setTimeout(() => {
      router.push(`/game/online/match?matchId=${encodeURIComponent(matchId)}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [phase, matchId, router]);

  const handleCancel = () => {
    void leaveQueue();
    setPhase("waiting");
    setCountdown(COUNTDOWN_SECONDS);
    setMatchedAt(null);
    setMatchId(null);
    setIsMatched(false);
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
          <Button variant="outline" onClick={joinQueue} disabled={isBusy}>
            再検索
          </Button>
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <MatchmakingQueue
            isSearching={isSearching}
            queueTime={queueTime}
            playersInQueue={playersInQueue}
            onCancel={handleCancel}
          />

          <Card className="relative min-h-[360px] overflow-hidden">
            <CardHeader>
              <CardTitle>ゲーム画面</CardTitle>
            </CardHeader>
            <CardContent className="relative flex w-full items-center justify-center text-sm text-muted-foreground">
              <div className="flex w-full max-w-4xl aspect-[8/5] items-center justify-center rounded-lg border border-border bg-muted/40">
                <p>ここにゲームキャンバスが表示されます。</p>
              </div>
              <GameStatus
                state={
                  phase === "waiting"
                    ? "waiting"
                    : phase === "matched_notice"
                      ? "matched"
                      : "countdown"
                }
                message={
                  phase === "waiting"
                    ? "対戦相手を検索中..."
                    : phase === "matched_notice"
                      ? "対戦相手が見つかりました。"
                      : "対戦開始までカウント中"
                }
                countdown={phase === "countdown" ? countdown : undefined}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGate>
  );
}
