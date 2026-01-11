"use client";

import { cn } from "@/lib/utils";

interface Player {
  name: string;
  score: number;
  avatarUrl?: string;
}

interface ScoreBoardProps {
  player1: Player;
  player2: Player;
  className?: string;
}

export function ScoreBoard({ player1, player2, className }: ScoreBoardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-8 rounded-lg bg-card p-4 font-mono",
        className
      )}
    >
      {/* Player 1 */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-muted-foreground">{player1.name}</span>
        <span className="text-5xl font-bold text-primary text-glow tabular-nums">
          {player1.score}
        </span>
      </div>

      {/* Separator */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl text-muted-foreground">VS</span>
      </div>

      {/* Player 2 */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-muted-foreground">{player2.name}</span>
        <span className="text-5xl font-bold text-secondary text-glow tabular-nums">
          {player2.score}
        </span>
      </div>
    </div>
  );
}
