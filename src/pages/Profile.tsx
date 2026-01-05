import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthContext";

interface UserProfile {
  id: number;
  login: string;
  displayName: string;
  imageUrl: string;
  wins: number;
  losses: number;
  rating: number;
  createdAt: string;
}

interface Match {
  id: number;
  player1Login: string;
  player2Login: string;
  player1Score: number;
  player2Score: number;
  winnerId: number | null;
  createdAt: string;
  endedAt: string | null;
}

export function ProfilePage() {
  const { login } = useParams<{ login?: string }>();
  const { user: currentUser, isAuthenticated, refresh } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !login || (currentUser && currentUser.login === login);
  const targetLogin = login || currentUser?.login;

  useEffect(() => {
    if (!targetLogin) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, matchesRes] = await Promise.all([
          fetch(`/api/users/${targetLogin}`),
          fetch(`/api/users/${targetLogin}/matches`),
        ]);

        if (!profileRes.ok) {
          throw new Error("User not found");
        }

        const profileData = await profileRes.json();
        const matchesData = await matchesRes.json();

        setProfile(profileData.user);
        setMatches(matchesData.matches || []);
        setDisplayName(profileData.user.displayName);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [targetLogin]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await response.json();
      setProfile((prev) => (prev ? { ...prev, displayName: data.user.displayName } : null));
      setIsEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/users/me/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload avatar");
      }

      const data = await response.json();
      setProfile((prev) => (prev ? { ...prev, imageUrl: data.user.imageUrl } : null));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    }
  };

  if (!isAuthenticated && !login) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">Please log in to view your profile</p>
            <Button asChild>
              <Link to="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <p className="text-destructive mb-4">{error || "Profile not found"}</p>
            <Button asChild variant="outline">
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winRate = profile.wins + profile.losses > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
    : 0;

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="mb-4">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Home
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={profile.imageUrl}
                alt={profile.displayName}
                className="w-20 h-20 rounded-full"
              />
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                  >
                    Change
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="flex items-center gap-2">
                    {profile.displayName}
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        ✏️
                      </button>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">@{profile.login}</p>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{profile.rating}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{profile.wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{profile.losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{winRate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isOwnProfile && (
        <div className="flex gap-2 mb-6">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/friends">Friends</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/leaderboard">Leaderboard</Link>
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match History</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No matches played yet</p>
          ) : (
            <div className="space-y-2">
              {matches.map((match) => {
                const isPlayer1 = match.player1Login === profile.login;
                const myScore = isPlayer1 ? match.player1Score : match.player2Score;
                const theirScore = isPlayer1 ? match.player2Score : match.player1Score;
                const opponent = isPlayer1 ? match.player2Login : match.player1Login;
                const won = match.winnerId !== null && (
                  (isPlayer1 && match.player1Score > match.player2Score) ||
                  (!isPlayer1 && match.player2Score > match.player1Score)
                );

                return (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      won ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={won ? "text-green-600" : "text-red-600"}>
                        {won ? "W" : "L"}
                      </span>
                      <span>vs</span>
                      <Link
                        to={`/profile/${opponent}`}
                        className="font-medium hover:underline"
                      >
                        {opponent}
                      </Link>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">
                        {myScore} - {theirScore}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </span>
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
