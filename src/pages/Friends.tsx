import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthContext";

interface Friend {
  id: number;
  login: string;
  displayName: string;
  imageUrl: string;
  isOnline: boolean;
}

interface FriendRequest {
  id: number;
  fromUser: {
    login: string;
    displayName: string;
    imageUrl: string;
  };
  toUser: {
    login: string;
    displayName: string;
    imageUrl: string;
  };
  createdAt: string;
}

export function FriendsPage() {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchFriends = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/friends", { credentials: "include" }),
        fetch("/api/friends/requests", { credentials: "include" }),
      ]);

      if (!friendsRes.ok || !requestsRes.ok) {
        throw new Error("Failed to load friends");
      }

      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();

      setFriends(friendsData.friends || []);
      setReceivedRequests(requestsData.received || []);
      setSentRequests(requestsData.sent || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load friends");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFriends();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/friends/request/${searchUsername.trim()}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send request");
      }

      setSearchUsername("");
      await fetchFriends();
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/friends/accept/${requestId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept request");
      }

      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/friends/reject/${requestId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject request");
      }

      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    }
  };

  const handleRemoveFriend = async (login: string) => {
    if (!confirm(`Remove ${login} from friends?`)) return;

    try {
      const response = await fetch(`/api/friends/${login}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove friend");
      }

      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove friend");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">Please log in to view your friends</p>
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
        <p className="text-muted-foreground">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="mb-4">
        <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Profile
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Add Friend</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendRequest} className="flex gap-2">
            <Input
              placeholder="Enter username"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !searchUsername.trim()}>
              {isSearching ? "Sending..." : "Send Request"}
            </Button>
          </form>
          {searchError && (
            <p className="mt-2 text-sm text-destructive">{searchError}</p>
          )}
        </CardContent>
      </Card>

      {receivedRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Pending Requests ({receivedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receivedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={request.fromUser.imageUrl}
                      alt={request.fromUser.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <Link
                        to={`/profile/${request.fromUser.login}`}
                        className="font-medium hover:underline"
                      >
                        {request.fromUser.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        @{request.fromUser.login}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sentRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Sent Requests ({sentRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={request.toUser.imageUrl}
                      alt={request.toUser.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <Link
                        to={`/profile/${request.toUser.login}`}
                        className="font-medium hover:underline"
                      >
                        {request.toUser.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        @{request.toUser.login}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Friends ({friends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No friends yet. Add some friends to see them here!
            </p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={friend.imageUrl}
                        alt={friend.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                          friend.isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <Link
                        to={`/profile/${friend.login}`}
                        className="font-medium hover:underline"
                      >
                        {friend.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        @{friend.login}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFriend(friend.login)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
