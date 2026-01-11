"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <div
      className={cn(
        "font-bold tracking-[.25em]",
        sizeConfig[size],
        className
      )}
    >
      <span className="text-primary text-glow">ぽん</span>
      <span className="text-muted-foreground">.</span>
      <span className="text-secondary">ふぉーてぃーつー</span>
    </div>
  );
}
