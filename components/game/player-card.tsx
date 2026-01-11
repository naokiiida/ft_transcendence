"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  name: string;
  avatarUrl?: string;
  elo?: number;
  wins?: number;
  losses?: number;
  isOnline?: boolean;
  isReady?: boolean;
  className?: string;
}

export function PlayerCard({
  name,
  avatarUrl,
  elo,
  wins,
  losses,
  isOnline,
  isReady,
  className,
}: PlayerCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={cn("w-full max-w-xs", className)}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isOnline !== undefined && (
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                isOnline ? "bg-green-500" : "bg-gray-500"
              )}
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{name}</span>
            {isReady && (
              <Badge variant="success" className="text-xs">
                Ready
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {elo !== undefined && (
              <span className="font-mono text-accent">{elo} ELO</span>
            )}
            {wins !== undefined && losses !== undefined && (
              <span>
                {wins}W / {losses}L
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
