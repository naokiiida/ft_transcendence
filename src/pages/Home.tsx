import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";

export function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <div className="container mx-auto p-8 text-center">
      <div className="flex justify-center items-center gap-8 mb-8">
        <span className="text-8xl">🏓</span>
      </div>
      <Card className="max-w-md mx-auto">
        <CardHeader className="gap-4">
          <CardTitle className="text-3xl font-bold">ft_transcendence</CardTitle>
          <CardDescription>
            A real-time multiplayer Pong game built with Bun, Hono, React, and shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : isAuthenticated && user ? (
            <>
              <div className="flex items-center justify-center gap-3 mb-2">
                <img
                  src={user.imageUrl}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full"
                />
                <div className="text-left">
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{user.login}</p>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button>Play Game</Button>
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
