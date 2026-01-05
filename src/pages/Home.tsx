import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";

export function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const handlePlayGame = async () => {
    setIsJoining(true);
    try {
      const response = await fetch("/api/game/quick-match");
      if (!response.ok) throw new Error("Failed to find game");
      const { gameId } = await response.json();
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error("Failed to join game:", error);
      setIsJoining(false);
    }
  };

  return (
    <div className="container mx-auto p-8 text-center">
      <div className="flex justify-center items-center gap-8 mb-8">
        <span className="text-8xl">🏓</span>
      </div>
      <Card className="w-[clamp(20rem,90vw,50ch)] mx-auto">
        <CardHeader className="gap-4">
          <CardTitle className="text-[clamp(1.5rem,5vw,1.875rem)] font-bold leading-tight">
            ft_transcendence
          </CardTitle>
          <CardDescription className="text-balance leading-relaxed break-words hyphens-auto">
            A real-time multiplayer Pong game built with Bun, Hono, React, and{" "}
            <span className="whitespace-nowrap">shadcn/ui</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : isAuthenticated && user ? (
            <>
              <Link to="/profile" className="flex items-center justify-center gap-3 mb-2 hover:bg-muted p-2 rounded-lg transition-colors">
                <img
                  src={user.imageUrl}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full"
                />
                <div className="text-left">
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{user.login}</p>
                </div>
              </Link>
              <div className="flex gap-4 justify-center">
                <Button onClick={handlePlayGame} disabled={isJoining}>
                  {isJoining ? "Joining..." : "Play Game"}
                </Button>
                <Button variant="outline" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/login">Play Now</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
