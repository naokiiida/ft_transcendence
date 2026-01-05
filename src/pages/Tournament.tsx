import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";

interface TournamentEntry {
  id: number;
  seed: number | null;
  placement: number | null;
  eliminated: boolean;
  user: {
    id: number;
    login: string;
    displayName: string;
    imageUrl: string | null;
    rating: number;
  };
}

interface TournamentMatch {
  id: number;
  round: number;
  matchNumber: number;
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  score1: number;
  score2: number;
  status: string;
}

interface Tournament {
  id: number;
  name: string;
  description: string | null;
  maxPlayers: number;
  status: "registration" | "in_progress" | "finished";
  currentRound: number;
  creatorId: number | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  entries: TournamentEntry[];
  matches: TournamentMatch[];
}

export function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${id}`);
      if (!response.ok) throw new Error("Tournament not found");
      const data = await response.json();
      setTournament(data.tournament);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournament");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${id}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      await fetchTournament();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${id}/leave`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      await fetchTournament();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${id}/start`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      await fetchTournament();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-muted-foreground">Loading tournament...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <p className="text-destructive mb-4">{error || "Tournament not found"}</p>
            <Button asChild variant="outline">
              <Link to="/tournaments">Back to Tournaments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isJoined = tournament.entries.some(e => e.user.id === user?.id);
  const isCreator = tournament.creatorId === user?.id;
  const canJoin = tournament.status === "registration" && !isJoined && tournament.entries.length < tournament.maxPlayers;
  const canLeave = tournament.status === "registration" && isJoined;
  const canStart = tournament.status === "registration" && isCreator && tournament.entries.length >= 2;

  // Group matches by round
  const matchesByRound: Record<number, TournamentMatch[]> = {};
  tournament.matches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round]!.push(m);
  });

  const totalRounds = Math.log2(tournament.maxPlayers);
  const getRoundName = (round: number) => {
    if (round === totalRounds) return "Final";
    if (round === totalRounds - 1) return "Semi-Finals";
    if (round === totalRounds - 2) return "Quarter-Finals";
    return `Round ${round}`;
  };

  const getPlayerName = (playerId: number | null) => {
    if (!playerId) return "TBD";
    const entry = tournament.entries.find(e => e.user.id === playerId);
    return entry?.user.displayName ?? "Unknown";
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-4">
        <Link to="/tournaments" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Tournaments
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{tournament.name}</CardTitle>
              {tournament.description && (
                <p className="text-muted-foreground mt-1">{tournament.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {canJoin && (
                <Button onClick={handleJoin} disabled={actionLoading}>
                  {actionLoading ? "Joining..." : "Join Tournament"}
                </Button>
              )}
              {canLeave && (
                <Button variant="outline" onClick={handleLeave} disabled={actionLoading}>
                  {actionLoading ? "Leaving..." : "Leave"}
                </Button>
              )}
              {canStart && (
                <Button onClick={handleStart} disabled={actionLoading}>
                  {actionLoading ? "Starting..." : "Start Tournament"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className="font-medium">
                {tournament.status === "registration" ? "Open for Registration" :
                 tournament.status === "in_progress" ? `In Progress (Round ${tournament.currentRound})` :
                 "Finished"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Players: </span>
              <span className="font-medium">{tournament.entries.length} / {tournament.maxPlayers}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {tournament.status === "registration" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registered Players</CardTitle>
          </CardHeader>
          <CardContent>
            {tournament.entries.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No players registered yet. Be the first to join!
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tournament.entries.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/profile/${entry.user.login}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted"
                  >
                    <img
                      src={entry.user.imageUrl ?? "/default-avatar.png"}
                      alt={entry.user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="overflow-hidden">
                      <p className="font-medium truncate">{entry.user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{entry.user.rating} ELO</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Bracket</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b)).map((roundStr) => {
                const round = parseInt(roundStr);
                const matches = matchesByRound[round] ?? [];
                return (
                  <div key={round} className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium text-center text-muted-foreground">
                      {getRoundName(round)}
                    </h3>
                    <div className="flex flex-col gap-4 justify-around flex-1">
                      {matches.map((match) => (
                        <Card key={match.id} className="w-48">
                          <CardContent className="p-3 space-y-2">
                            <MatchPlayer
                              name={getPlayerName(match.player1Id)}
                              score={match.score1}
                              isWinner={match.winnerId === match.player1Id}
                              isFinished={match.status === "finished"}
                            />
                            <div className="border-t" />
                            <MatchPlayer
                              name={getPlayerName(match.player2Id)}
                              score={match.score2}
                              isWinner={match.winnerId === match.player2Id}
                              isFinished={match.status === "finished"}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {tournament.status === "finished" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Final Standings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tournament.entries
                    .filter(e => e.placement)
                    .sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99))
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3">
                        <span className="w-8 text-center font-bold">
                          {entry.placement === 1 ? "🥇" :
                           entry.placement === 2 ? "🥈" :
                           entry.placement === 3 ? "🥉" :
                           `#${entry.placement}`}
                        </span>
                        <img
                          src={entry.user.imageUrl ?? "/default-avatar.png"}
                          alt={entry.user.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium">{entry.user.displayName}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function MatchPlayer({
  name,
  score,
  isWinner,
  isFinished,
}: {
  name: string;
  score: number;
  isWinner: boolean;
  isFinished: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${isFinished && isWinner ? "font-bold" : ""} ${isFinished && !isWinner && name !== "TBD" ? "text-muted-foreground" : ""}`}>
      <span className="truncate">{name}</span>
      {isFinished && name !== "TBD" && (
        <span className="font-mono">{score}</span>
      )}
    </div>
  );
}
