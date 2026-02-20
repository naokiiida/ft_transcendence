"use client"; // クライアントサイドで動作するコンポーネント

import { useEffect, useRef, useState } from "react";
import Link from "next/link"; // 画面遷移用リンク
import { createGameState, endGame } from "@/lib/game/engine";
import { renderGame } from "@/lib/game/renderer";
import type { GameState, InputState } from "@/lib/game/state";
import { PongEngine } from "@/lib/game/engine";
import {
  //
  DEFAULT_AI_CONFIGS,
  DEFAULT_AI_UNLOCKS,
  getAvailableAiLevels,
} from "@/lib/game/controllers";
import { LocalMatch } from "@/lib/game/match";
import { Button } from "@/components/ui/button";

// AIレベルの選択肢を取得
const AVAILABLE_AI_LEVELS = getAvailableAiLevels(DEFAULT_AI_UNLOCKS);
type AiLevel = (typeof AVAILABLE_AI_LEVELS)[number]["id"];

// ゲームページコンポーネント
export default function GamePage() {
  // 画面が変わらない要素
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const gameOverRef = useRef(false);
  // 画面が変わる要素（CPU難易度、リスタート、ゲームオーバー）
  const [aiLevel, setAiLevel] = useState<AiLevel>("medium");
  const [sessionId, setSessionId] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  //　useEffect
  // React/Next.jsでは、画面の処理と、実際に動く処理は分けられてる。
  //　JSX（return の中）
  // 実際に動く処理（useEffect の中）
  useEffect(() => {
    //canvas要素の取得
    const canvas = canvasRef.current;
    if (!canvas) return;
    // ctx(画面描画用オブジェクト)の取得
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    //  ゲームの初期化
    const state = createGameState(canvas.width, canvas.height);
    stateRef.current = state;
    // ゲームオーバーフラグの初期化
    gameOverRef.current = false;
    setGameOver(false);
    // 入力状態を管理するオブジェクト
    const input: InputState = { up: false, down: false };
    // ゲームエンジンとマッチの作成
    const engine = new PongEngine();

    const currentConfig = DEFAULT_AI_CONFIGS[aiLevel];
    const cpuName = currentConfig.name;

    const match = new LocalMatch(engine, input, DEFAULT_AI_CONFIGS[aiLevel]);

    // キー割当
    const keyMap: Record<string, "up" | "down"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      w: "up",
      s: "down",
      W: "up",
      S: "down",
    };

    // テキスト入力中はゲームキーを無視
    const isTyping = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
    };

    // キーイベントハンドラ 押したときと離したときで分ける
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event)) return;
      const action = keyMap[event.key];
      if (!action) return;
      input[action] = true;
      event.preventDefault();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (isTyping(event)) return;
      const action = keyMap[event.key];
      if (!action) return;
      input[action] = false;
      event.preventDefault();
    };

    // イベントリスナー登録
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // 時間管理
    let lastTime = performance.now();
    let frameId = 0;

    // ゲームループ
    const frame = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;
      match.tick(state, dt);
      if (state.gameOver !== gameOverRef.current) {
        gameOverRef.current = state.gameOver;
        setGameOver(state.gameOver);
      }
      renderGame(ctx, state, {leftName: "Player", rightName: "CPU(" + cpuName + ")"});
      frameId = requestAnimationFrame(frame);
    };

    //初回起動
    frameId = requestAnimationFrame(frame);

    // クリーンアップ関数
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [aiLevel, sessionId]);
  // useEffectの依存配列、ページの最初、aiLevelかsessionIdが変わったときに再実行される。

  // JSX（画面の見た目）
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
