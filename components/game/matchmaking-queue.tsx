"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchmakingQueueProps {
  isSearching: boolean;
  queueTime?: number;
  playersInQueue?: number;
  onCancel: () => void;
  className?: string;
}

export function MatchmakingQueue({
  isSearching,
  queueTime = 0,
  playersInQueue,
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
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Finding Opponent
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

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground">vs</div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 animate-pulse rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-24 animate-pulse" />
              <Skeleton className="h-3 w-16 animate-pulse" />
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={onCancel} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
}
