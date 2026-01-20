"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createGameState, endGame } from "@/lib/game/engine";
import { renderGame } from "@/lib/game/renderer";
import type { GameState, InputState } from "@/lib/game/state";
import { PongEngine } from "@/lib/game/engine";
import {
  DEFAULT_AI_CONFIGS,
  DEFAULT_AI_UNLOCKS,
  getAvailableAiLevels,
} from "@/lib/game/controllers";
import { LocalMatch } from "@/lib/game/match";
import { Button } from "@/components/ui/button";

const AVAILABLE_AI_LEVELS = getAvailableAiLevels(DEFAULT_AI_UNLOCKS);
type AiLevel = (typeof AVAILABLE_AI_LEVELS)[number]["id"];

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const gameOverRef = useRef(false);
  const [aiLevel, setAiLevel] = useState<AiLevel>("medium");
  const [sessionId, setSessionId] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = createGameState(canvas.width, canvas.height);
    stateRef.current = state;
    gameOverRef.current = false;
    setGameOver(false);
    const input: InputState = { up: false, down: false };
    const engine = new PongEngine();
    const match = new LocalMatch(engine, input, DEFAULT_AI_CONFIGS[aiLevel]);

    const keyMap: Record<string, "up" | "down"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      w: "up",
      s: "down",
      W: "up",
      S: "down",
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = keyMap[event.key];
      if (!action) return;
      input[action] = true;
      event.preventDefault();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const action = keyMap[event.key];
      if (!action) return;
      input[action] = false;
      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let lastTime = performance.now();
    let frameId = 0;

    const frame = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;
      match.tick(state, dt);
      if (state.gameOver !== gameOverRef.current) {
        gameOverRef.current = state.gameOver;
        setGameOver(state.gameOver);
      }
      renderGame(ctx, state);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [aiLevel, sessionId]);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
        <h1 className="text-3xl font-semibold text-glow">Local Pong</h1>
        <p className="text-sm text-muted-foreground">
          W/S または ↑/↓ で操作します。右側はCPUです。先取5点。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {AVAILABLE_AI_LEVELS.map((level) => (
            <Button
              key={level.id}
              variant={aiLevel === level.id ? "default" : "outline"}
              onClick={() => {
                setAiLevel(level.id);
                setSessionId((current) => current + 1);
              }}
            >
              {DEFAULT_AI_CONFIGS[level.id].name}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSessionId((current) => current + 1);
            }}
          >
            リスタート
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (stateRef.current) {
                endGame(stateRef.current);
              }
            }}
          >
            終了
          </Button>
          {gameOver ? (
            <Button asChild variant="outline">
              <Link href="/">トップに戻る</Link>
            </Button>
          ) : null}
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full max-w-4xl rounded-lg border border-border bg-black shadow"
        />
      </div>
    </div>
  );
}
