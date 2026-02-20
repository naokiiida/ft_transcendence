"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createGameState, endGame } from "@/lib/game/engine";
import { renderGame } from "@/lib/game/renderer";
import type { GameState, InputState } from "@/lib/game/state"; // InputStateを追加
import { PongEngine } from "@/lib/game/engine";
import { Match } from "@/lib/game/match"; // LocalMatchではなくMatchをインポート
import { HumanController } from "@/lib/game/controllers"; // HumanControllerをインポート（パスは確認してください）
import { Button } from "@/components/ui/button";

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const gameOverRef = useRef(false);
  
  const [sessionId, setSessionId] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ゲーム状態初期化
    const state = createGameState(canvas.width, canvas.height);
    stateRef.current = state;
    gameOverRef.current = false;
    setGameOver(false);

    // ★変更点1: 左右それぞれの入力状態オブジェクトを作成
    const inputLeft: InputState = { up: false, down: false };
    const inputRight: InputState = { up: false, down: false };

    // ★変更点2: Matchクラスを直接使い、両方にHumanControllerを設定
    const engine = new PongEngine();
    const match = new Match(
      engine,
      new HumanController(inputLeft),  // 左: WASD操作
      new HumanController(inputRight)  // 右: 矢印操作
    );

    // ★変更点3: キー操作を左右のInputStateに振り分け
    const isTyping = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event)) return;
      switch (event.key) {
        // 左プレイヤー (WASD)
        case "w": case "W": inputLeft.up = true; break;
        case "s": case "S": inputLeft.down = true; break;
        // 右プレイヤー (矢印キー)
        case "ArrowUp": inputRight.up = true; event.preventDefault(); break;
        case "ArrowDown": inputRight.down = true; event.preventDefault(); break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isTyping(event)) return;
      switch (event.key) {
        // 左プレイヤー
        case "w": case "W": inputLeft.up = false; break;
        case "s": case "S": inputLeft.down = false; break;
        // 右プレイヤー
        case "ArrowUp": inputRight.up = false; break;
        case "ArrowDown": inputRight.down = false; break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let lastTime = performance.now();
    let frameId = 0;

    const frame = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;
      
      // Matchクラスのtickを実行（内部でそれぞれのgetInputが呼ばれる）
      match.tick(state, dt);

      if (state.gameOver !== gameOverRef.current) {
        gameOverRef.current = state.gameOver;
        setGameOver(state.gameOver);
      }
      renderGame(ctx, state, {leftName: "Left player", rightName: "Right player"});
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
        <h1 className="text-3xl font-semibold text-glow">Local PvP</h1>
        <p className="text-sm text-muted-foreground">
          <strong>Left Player:</strong> W / S &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Right Player:</strong> ↑ / ↓
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="secondary" onClick={() => setSessionId(c => c + 1)}>
            リスタート
          </Button>
          <Button variant="outline" onClick={() => stateRef.current && endGame(stateRef.current)}>
            終了
          </Button>
          {gameOver && (
            <Button asChild variant="outline">
              <Link href="/">トップに戻る</Link>
            </Button>
          )}
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
