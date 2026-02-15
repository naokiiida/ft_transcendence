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
  | { type: "welcome"; matchId: string; side: "left" | "right"; state: GameState }
  | { type: "state"; tick: number; state: GameState }
  | { type: "game_over"; winner: GameState["winner"]; score: GameState["score"] }
  | { type: "player_left"; winner: "left" | "right" }
  | { type: "error"; message?: string };

type ClientMessage =
  | { type: "join"; matchId: string }
  | { type: "input"; up: boolean; down: boolean; seq: number };

export default function OnlineMatchPage() {
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
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
      setStatus("error");
      setMessage("matchId が見つかりません。");
      return;
    }

    const ws = new WebSocket(`${wsUrl}?matchId=${encodeURIComponent(matchId)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("waiting");
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
        setStatus("playing");
        return;
      }

      if (msg.type === "state") {
        stateRef.current = msg.state;
        setStatus("playing");
        return;
      }

      if (msg.type === "game_over") {
        setStatus("finished");
        const label =
          msg.winner === "left" ? "Left" : msg.winner === "right" ? "Right" : null;
        setWinner(label);
        return;
      }

      if (msg.type === "player_left") {
        setStatus("disconnected");
        setMessage("対戦相手が退出しました。");
        return;
      }

      if (msg.type === "error") {
        setStatus("error");
        setMessage(msg.message ?? "エラーが発生しました。");
      }
    };

    ws.onclose = () => {
      if (statusRef.current === "finished") return;
      if (statusRef.current === "disconnected") return;
      setStatus("error");
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

  return (
    <AuthGate>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">オンライン対戦</h1>
            <p className="text-sm text-muted-foreground">
              {side ? `あなたは ${side.toUpperCase()} 側です。` : "接続中..."}
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
          <CardContent className="relative flex h-72 items-center justify-center">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full max-w-4xl rounded-lg border border-border bg-black shadow"
            />
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
