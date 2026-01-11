"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Status = "online" | "offline" | "away" | "in-game";

interface OnlineIndicatorProps {
  status: Status;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig: Record<Status, { color: string; label: string }> = {
  online: { color: "bg-green-500", label: "Online" },
  offline: { color: "bg-gray-500", label: "Offline" },
  away: { color: "bg-yellow-500", label: "Away" },
  "in-game": { color: "bg-purple-500", label: "In Game" },
};

const sizeConfig = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function OnlineIndicator({
  status,
  showTooltip = true,
  size = "md",
  className,
}: OnlineIndicatorProps) {
  const { color, label } = statusConfig[status];

  const indicator = (
    <span
      className={cn(
        "inline-block rounded-full",
        color,
        sizeConfig[size],
        status === "online" && "animate-pulse",
        className
      )}
    />
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
