import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaderboardEntry {
  rank: number;
  login: string;
  displayName: string;
  imageUrl: string;
  rating: number;
  wins: number;
  losses: number;
}

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard?limit=50");
        if (!response.ok) {
          throw new Error("Failed to load leaderboard");
        }
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <p className="text-destructive mb-4">{error}</p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="mb-4">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Home
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No players ranked yet. Be the first to play!
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const medal =
                  index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

                return (
                  <div
                    key={entry.login}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index < 3 ? "bg-amber-500/10" : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center font-bold">
                        {medal || entry.rank}
                      </span>
                      <img
                        src={entry.imageUrl}
                        alt={entry.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <Link
                          to={`/profile/${entry.login}`}
                          className="font-medium hover:underline"
                        >
                          {entry.displayName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          @{entry.login}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.rating}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.wins}W / {entry.losses}L
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
