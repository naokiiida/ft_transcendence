"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MatchmakingQueue } from "@/components/game/matchmaking-queue";
import { GameStatus } from "@/components/game/game-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGate } from "@/components/auth/auth-gate";

type MatchmakingStatus = {
  in_queue: boolean;
  players_in_queue: number;
  queued_at: number | null;
  matched: boolean;
  matched_at: number | null;
  match_id: string | null;
  side: "left" | "right" | null;
  notice_reason: "opponent_left" | null;
  notice_match_id: string | null;
  notice_at: number | null;
};

type MatchPhase = "waiting" | "matched_notice" | "countdown" | "matched";

const MATCHED_NOTICE_SECONDS = 2;
const COUNTDOWN_SECONDS = 3;

export default function OnlineGamePage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const [isSearching, setIsSearching] = useState(false);
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
  const [lastNoticeAt, setLastNoticeAt] = useState<number | null>(null);
  const isMatchedRef = useRef(isMatched);
  const matchIdRef = useRef(matchId);

  useEffect(() => {
    isMatchedRef.current = isMatched;
  }, [isMatched]);

  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

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
    if (!status.matched) {
      setPhase("waiting");
      setCountdown(COUNTDOWN_SECONDS);
      setMatchedAt(null);
      setMatchId(null);
    }
    if (
      status.notice_reason === "opponent_left" &&
      status.notice_at !== null &&
      (lastNoticeAt === null || status.notice_at > lastNoticeAt)
    ) {
      setError("対戦相手がマッチングをキャンセルしました。");
      setLastNoticeAt(status.notice_at);
    }
  }, [lastNoticeAt]);

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
    if (!isSearching && !isMatched) return;
    const intervalMs = isMatched ? 1000 : 5000;
    void fetchStatus().catch(() => {
      // polling errors are non-fatal; next poll will retry
    });
    const poll = setInterval(() => {
      void fetchStatus().catch(() => {
        // polling errors are non-fatal; next poll will retry
      });
    }, intervalMs);
    return () => clearInterval(poll);
  }, [isSearching, isMatched, fetchStatus]);

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
      void fetchStatus()
        .then(() => {
          if (!isMatchedRef.current) return;
          const currentMatchId = matchIdRef.current;
          if (!currentMatchId) return;
          router.push(
            `/game/online/match?matchId=${encodeURIComponent(currentMatchId)}`,
          );
        })
        .catch(() => {
          setError("ステータス確認に失敗しました。");
          setPhase("waiting");
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [phase, matchId, router, fetchStatus]);

  const handleCancel = () => {
    void leaveQueue();
    setPhase("waiting");
    setCountdown(COUNTDOWN_SECONDS);
    setMatchedAt(null);
    setMatchId(null);
    setIsMatched(false);
  };

  return (
    <Suspense fallback={
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
      </div>
    }>
      <AuthGate>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">オンライン対戦</h1>
            <p className="text-sm text-muted-foreground">
              マッチング待機中はステータスが表示されます。
            </p>
          </div>
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <MatchmakingQueue
            isSearching={isSearching}
            isMatched={isMatched}
            isBusy={isBusy}
            queueTime={queueTime}
            playersInQueue={playersInQueue}
            onStart={joinQueue}
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
                    : phase === "matched_notice" || phase === "matched"
                      ? "matched"
                      : phase === "countdown"
                        ? "countdown"
                        : "playing"
                }
                message={
                  phase === "waiting"
                    ? isSearching
                      ? "対戦相手を検索中..."
                      : "検索開始してください。"
                    : phase === "matched_notice" || phase === "matched"
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
    </Suspense>
  );
}
