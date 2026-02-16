"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchmakingQueueProps {
  isSearching: boolean;
  isBusy?: boolean;
  isMatched?: boolean;
  queueTime?: number;
  playersInQueue?: number;
  onStart?: () => void;
  onCancel: () => void;
  className?: string;
}

export function MatchmakingQueue({
  isSearching,
  isBusy = false,
  isMatched = false,
  queueTime = 0,
  playersInQueue,
  onStart,
  onCancel,
  className,
}: MatchmakingQueueProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2
            className={cn("h-5 w-5 text-primary", isSearching && "animate-spin")}
          />
          {isSearching ? "Finding Opponent" : "Matchmaking"}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Time in queue</span>
          <span className="font-mono text-foreground">
            {formatTime(queueTime)}
          </span>
        </div>

        {playersInQueue !== undefined && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Players searching
            </span>
            <span className="font-mono text-foreground">{playersInQueue}</span>
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {isMatched
            ? "マッチ成立。対戦準備中です。"
            : isSearching
              ? "対戦相手を検索中です。"
              : "検索開始を押してマッチングを開始します。"}
        </div>

        {!isSearching && !isMatched && (
          <Button
            onClick={onStart}
            className="w-full"
            disabled={isBusy || !onStart}
          >
            検索開始
          </Button>
        )}

        {isSearching && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
            disabled={isBusy}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
