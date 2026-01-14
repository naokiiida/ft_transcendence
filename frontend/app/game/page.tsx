"use client";

import { useEffect, useRef } from "react";
import {
  createGameState,
  endGame,
  renderGame,
  updateGame,
} from "@/lib/game/engine";
import type { GameState, InputState } from "@/lib/game/engine";
import { Button } from "@/components/ui/button";

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = createGameState(canvas.width, canvas.height);
    stateRef.current = state;
    const input: InputState = { up: false, down: false };

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
      updateGame(state, input, dt);
      renderGame(ctx, state);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
        <h1 className="text-3xl font-semibold text-glow">Local Pong</h1>
        <p className="text-sm text-muted-foreground">
          W/S または ↑/↓ で操作します。右側はCPUです。先取5点。
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            if (stateRef.current) {
              endGame(stateRef.current);
            }
          }}
        >
          終了
        </Button>
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
