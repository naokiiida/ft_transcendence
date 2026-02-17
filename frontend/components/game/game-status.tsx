"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, Pause, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type GameState =
  | "waiting"
  | "matched"
  | "countdown"
  | "playing"
  | "paused"
  | "finished"
  | "disconnected";

interface GameStatusProps {
  state: GameState;
  message?: string;
  countdown?: number;
  reconnectProgress?: number;
  winner?: string;
  className?: string;
}

export function GameStatus({
  state,
  message,
  countdown,
  reconnectProgress,
  winner,
  className,
}: GameStatusProps) {
  if (state === "playing") {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {state === "waiting" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-xl font-semibold">
              {message || "Waiting for opponent..."}
            </p>
          </>
        )}

        {state === "matched" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-12 w-12 text-primary" />
            <p className="text-xl font-semibold">
              {message || "Opponent found!"}
            </p>
          </div>
        )}

        {state === "countdown" && countdown !== undefined && (
          <span className="text-8xl font-bold text-primary text-glow animate-pulse">
            {countdown}
          </span>
        )}

        {state === "paused" && (
          <Alert variant="warning" className="max-w-sm">
            <Pause className="h-4 w-4" />
            <AlertTitle>Game Paused</AlertTitle>
            <AlertDescription>
              {message || "Waiting for opponent to reconnect..."}
            </AlertDescription>
            {reconnectProgress !== undefined && (
              <Progress value={reconnectProgress} className="mt-2" />
            )}
          </Alert>
        )}

        {state === "disconnected" && (
          <Alert variant="destructive" className="max-w-sm">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Opponent Disconnected</AlertTitle>
            <AlertDescription>
              {message || "Your opponent has left the game."}
            </AlertDescription>
          </Alert>
        )}

        {state === "finished" && (
          <div className="flex flex-col items-center gap-4">
            <Trophy className="h-16 w-16 text-accent" />
            <p className="text-3xl font-bold text-accent text-glow">
              {winner ? `${winner} の勝利！` : "試合終了"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
