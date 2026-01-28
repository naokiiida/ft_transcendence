"use client";

import { useEffect, useRef, useState } from "react";

type GameStateMessage = {
  type: "game_state";
  game_id: string;
  state: {
    ball: { x: number; y: number; vx: number; vy: number };
    paddle1: { y: number };
    paddle2: { y: number };
    score: { player1: number; player2: number };
    status: "playing";
    timestamp: number;
  };
};

type GameJoinedMessage = {
  type: "game_joined";
  game_id: string;
  player_number: 1 | 2 | null;
  role: "player" | "spectator";
  opponent: null;
  player: { id: string; display_name: string };
};

type ServerMessage = GameStateMessage | GameJoinedMessage | { type: string };

function isGameJoinedMessage(
  message: ServerMessage
): message is GameJoinedMessage {
  return message.type === "game_joined";
}

export default function WsTestPage() {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState("disconnected");
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [lastState, setLastState] = useState<GameStateMessage | null>(null);
  const [lastMessageType, setLastMessageType] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ??
      `${protocol}://localhost:3001/api/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.addEventListener("open", () => setStatus("connected"));
    ws.addEventListener("close", () => setStatus("disconnected"));
    ws.addEventListener("error", () => setStatus("error"));
    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;
        setLastMessageType(data.type);
        if (isGameJoinedMessage(data)) {
          setPlayerName(data.player.display_name);
        }
        if (
          data.type === "game_state" &&
          "game_id" in data &&
          "state" in data
        ) {
          setLastState(data as GameStateMessage);
        }
      } catch {
        setLastMessageType("invalid_json");
      }
    });

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">WS Test</h1>
        <div className="text-sm text-muted-foreground">
          接続先:{" "}
          <span className="font-mono">{wsRef.current?.url ?? "未接続"}</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            状態: <span className="font-mono">{status}</span>
          </div>
          <div>
            プレイヤー:{" "}
            <span className="font-mono">{playerName ?? "未割当"}</span>
          </div>
          <div>
            最終メッセージ:{" "}
            <span className="font-mono">{lastMessageType ?? "なし"}</span>
          </div>
        </div>
        {lastState ? (
          <div className="grid gap-2 rounded-md bg-muted p-4 text-sm">
            <div>
              game_id: <span className="font-mono">{lastState.game_id}</span>
            </div>
            <div>
              ball:{" "}
              <span className="font-mono">
                x={lastState.state.ball.x.toFixed(1)} y=
                {lastState.state.ball.y.toFixed(1)}
              </span>
            </div>
            <div>
              paddle1.y:{" "}
              <span className="font-mono">
                {lastState.state.paddle1.y.toFixed(1)}
              </span>
            </div>
            <div>
              paddle2.y:{" "}
              <span className="font-mono">
                {lastState.state.paddle2.y.toFixed(1)}
              </span>
            </div>
            <div>
              score:{" "}
              <span className="font-mono">
                {lastState.state.score.player1} -{" "}
                {lastState.state.score.player2}
              </span>
            </div>
            <div>
              timestamp:{" "}
              <span className="font-mono">
                {new Date(lastState.state.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            game_state を待機中です。
          </div>
        )}
      </div>
    </div>
  );
}
