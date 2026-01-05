import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthContext";

interface Tournament {
  id: number;
  name: string;
  description: string | null;
  maxPlayers: number;
  currentPlayers: number;
  status: "registration" | "in_progress" | "finished";
  currentRound: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export function TournamentsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Create tournament form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMaxPlayers, setNewMaxPlayers] = useState(8);
  const [isCreating, setIsCreating] = useState(false);

  const fetchTournaments = async () => {
    try {
      const url = filter === "all"
        ? "/api/tournaments"
        : `/api/tournaments?status=${filter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load tournaments");
      const data = await response.json();
      setTournaments(data.tournaments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournaments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          maxPlayers: newMaxPlayers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create tournament");
      }

      const data = await response.json();
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
      navigate(`/tournament/${data.tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tournament");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      registration: "bg-green-500/20 text-green-600",
      in_progress: "bg-yellow-500/20 text-yellow-600",
      finished: "bg-gray-500/20 text-gray-600",
    };
    const labels: Record<string, string> = {
      registration: "Open",
      in_progress: "In Progress",
      finished: "Finished",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-muted-foreground">Loading tournaments...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <div className="mb-4">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Home
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        {isAuthenticated && (
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "Create Tournament"}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Create Tournament</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter tournament name"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <Label htmlFor="maxPlayers">Max Players</Label>
                <select
                  id="maxPlayers"
                  value={newMaxPlayers}
                  onChange={(e) => setNewMaxPlayers(parseInt(e.target.value))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value={4}>4 players</option>
                  <option value={8}>8 players</option>
                  <option value={16}>16 players</option>
                </select>
              </div>
              <Button type="submit" disabled={isCreating || !newName.trim()}>
                {isCreating ? "Creating..." : "Create Tournament"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 mb-4">
        {["all", "registration", "in_progress", "finished"].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "registration" ? "Open" : f === "in_progress" ? "Active" : "Finished"}
          </Button>
        ))}
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No tournaments found. Be the first to create one!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{tournament.name}</h3>
                        {getStatusBadge(tournament.status)}
                      </div>
                      {tournament.description && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {tournament.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {tournament.currentPlayers} / {tournament.maxPlayers} players
                        {tournament.status === "in_progress" && ` • Round ${tournament.currentRound}`}
                      </p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
