"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/auth/auth-gate";
import { GameStatus } from "@/components/game/game-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { renderGame } from "@/lib/game/renderer";
import type { GameState, InputState } from "@/lib/game/state";

type ServerMessage =
  | {
      type: "welcome";
      matchId: string;
      side: "left" | "right";
      state: GameState;
      opponentName: string | null;
    }
  | { type: "state"; tick: number; state: GameState }
  | {
      type: "game_over";
      winner: GameState["winner"];
      score: GameState["score"];
    }
  | { type: "player_left"; winner: "left" | "right" }
  | {
      type: "match_aborted";
      reason: "timeout" | "no_opponent";
      message?: string;
    }
  | { type: "match_dissolved"; reason: "opponent_left"; message?: string }
  | { type: "error"; message?: string };

type ClientMessage =
  | { type: "join"; matchId: string }
  | { type: "input"; up: boolean; down: boolean; seq: number }
  | { type: "ping" };

export function OnlineMatchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/api/ws";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({ up: false, down: false });
  const seqRef = useRef(0);
  const [status, setStatus] = useState<
    "connecting" | "waiting" | "playing" | "finished" | "disconnected" | "error"
  >("connecting");
  const [message, setMessage] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const statusRef = useRef(status);

  const updateStatus = (next: typeof status) => {
    statusRef.current = next;
    setStatus(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frameId = 0;

    const frame = () => {
      const state = stateRef.current;
      if (state) {
        renderGame(ctx, state);
      }
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!matchId) {
      updateStatus("error");
      setMessage("matchId が見つかりません。");
      return;
    }

    const ws = new WebSocket(`${wsUrl}?matchId=${encodeURIComponent(matchId)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      updateStatus("waiting");
      const join: ClientMessage = { type: "join", matchId };
      ws.send(JSON.stringify(join));
    };

    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }

      if (msg.type === "welcome") {
        stateRef.current = msg.state;
        setSide(msg.side);
        setOpponentName(msg.opponentName ?? null);
        updateStatus("waiting");
        setMessage(
          "開始前に対戦相手が離席しました。マッチングに戻るボタンを押してください。",
        );
        return;
      }

      if (msg.type === "state") {
        stateRef.current = msg.state;
        updateStatus("playing");
        return;
      }

      if (msg.type === "game_over") {
        updateStatus("finished");
        const label =
          msg.winner === "left"
            ? "Left"
            : msg.winner === "right"
              ? "Right"
              : null;
        setWinner(label);
        return;
      }

      if (msg.type === "player_left") {
        updateStatus("disconnected");
        setMessage("対戦相手が退出しました。");
        return;
      }

      if (msg.type === "match_aborted") {
        updateStatus("disconnected");
        setMessage(
          msg.message ??
            (msg.reason === "no_opponent"
              ? "相手が参加しなかったため試合を終了しました。"
              : "通信が不安定なため試合を終了しました。"),
        );
        return;
      }

      if (msg.type === "match_dissolved") {
        updateStatus("disconnected");
        setMessage(msg.message ?? "対戦相手がマッチングをキャンセルしました。");
        return;
      }

      if (msg.type === "error") {
        updateStatus("error");
        setMessage(msg.message ?? "エラーが発生しました。");
      }
    };

    ws.onclose = () => {
      if (statusRef.current === "finished") return;
      if (statusRef.current === "disconnected") return;
      updateStatus("error");
      setMessage("接続が切断されました。");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [matchId, wsUrl]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const keyMap: Record<string, "up" | "down"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      w: "up",
      s: "down",
      W: "up",
      S: "down",
    };

    const sendInput = () => {
      if (!wsRef.current) return;
      if (wsRef.current.readyState !== WebSocket.OPEN) return;
      const payload: ClientMessage = {
        type: "input",
        up: inputRef.current.up,
        down: inputRef.current.down,
        seq: (seqRef.current += 1),
      };
      wsRef.current.send(JSON.stringify(payload));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = keyMap[event.key];
      if (!action) return;
      if (!inputRef.current[action]) {
        inputRef.current[action] = true;
        sendInput();
      }
      event.preventDefault();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const action = keyMap[event.key];
      if (!action) return;
      if (inputRef.current[action]) {
        inputRef.current[action] = false;
        sendInput();
      }
      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!wsRef.current) return;
      if (wsRef.current.readyState !== WebSocket.OPEN) return;
      const payload: ClientMessage = { type: "ping" };
      wsRef.current.send(JSON.stringify(payload));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status !== "disconnected" && status !== "error") return;
    const timer = setTimeout(() => {
      router.push("/game/online");
    }, 2000);
    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <AuthGate>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">オンライン対戦</h1>
            <p className="text-sm text-muted-foreground">
              {side ? `あなたは ${side.toUpperCase()} 側です。` : "接続中..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {opponentName
                ? `対戦相手: ${opponentName}`
                : "対戦相手: 取得中..."}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/game/online")}>
            マッチングに戻る
          </Button>
        </div>

        <Card className="relative min-h-[360px] overflow-hidden">
          <CardHeader>
            <CardTitle>マッチ</CardTitle>
          </CardHeader>
          <CardContent className="relative flex w-full items-center justify-center">
            <div className="w-full max-w-4xl aspect-[8/5]">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="h-full w-full rounded-lg border border-border bg-black shadow"
              />
            </div>
            <GameStatus
              state={
                status === "playing"
                  ? "playing"
                  : status === "finished"
                    ? "finished"
                    : status === "disconnected" || status === "error"
                      ? "disconnected"
                      : "waiting"
              }
              message={message ?? undefined}
              winner={winner ?? undefined}
            />
          </CardContent>
        </Card>
      </div>
    </AuthGate>
  );
}
