"use client";

import { OnlineIndicator } from "@/components/shared/online-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/components/auth/user-context";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/*
フレンドのオンライン、オフライン認定
2分以内にAPI利用で、オンライン（last_seenの利用実績に合わせる）
2から5分は離席扱い、5分以上で離席扱い。




*/

// ===== 戦績表示用 =====
type MatchRow = {
  id: string;
  player1_id: string;
  player2_id: string | null;
  winner_id: string | null;
  player1_score: number;
  player2_score: number;
  created_at: string;
  status: string;
};

type MatchHistoryResponse = {
  games: MatchRow[];
  total: number;
  limit: number;
  offset: number;
};

// ===== 統計表示用 =====
type AchievementRow = {
  id: string;
  title: string;
  description: string;
  progress: number;
  unlocked: boolean;
};

type LeaderboardEntry = {
  uuid: string;
  display_name: string;
  avatar_url: string | null;
  user_score: number;
  position: number;
};

type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
};

// ===== ランク計算用の閾値 =====
const rankTiers = [
  { label: "Bronze", min: 0 },
  { label: "Silver", min: 100 },
  { label: "Gold", min: 200 },
  { label: "Platinum", min: 300 },
  { label: "Diamond", min: 450 },
];

// ===== APIレスポンス型 =====
type FriendEntry = {
  friendship_id: string;
  friend_id: string;
  display_name: string;
  avatar_url: string | null;
  user_score: number;
  last_seen: string;
};

type PendingRequestEntry = {
  id: string;
  requester_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

type SentRequestEntry = {
  id: string;
  addressee_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

type SearchUserEntry = {
  uuid: string;
  display_name: string;
  avatar_url: string | null;
};

/*
サーバーのログアウトが失敗しても、フロントエンド側の状態はクリアする。
だが、厳密に、サーバー側のセッションを削除できなかった場合、
ログアウト失敗時は、エラー表示して残るのも手。
*/
// ユーザーページ
// ===== ユーザーページ =====
export default function UserPage() {
  // UseUserからログアウト関数を取得
  const { user, logout, refreshUser, setUserFromApi } = useUser();
  // ルーターを取得
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]); //フレンド一覧
  const [pendingRequests, setPendingRequests] = useState<PendingRequestEntry[]>(
    [],
  ); //受信申請一覧
  const [sentRequests, setSentRequests] = useState<SentRequestEntry[]>([]); //送信申請一覧
  const [friendsLoading, setFriendsLoading] = useState(false); //フレンド一覧の読み込み状態
  const [pendingLoading, setPendingLoading] = useState(false); //受信申請の読み込み状態
  const [sentLoading, setSentLoading] = useState(false); // 送信申請の読み込み状態
  const [friendsError, setFriendsError] = useState<string | null>(null); //フレンド一覧のエラー状態
  const [pendingError, setPendingError] = useState<string | null>(null); //受信申請のエラー状態
  const [sentError, setSentError] = useState<string | null>(null); //送信申請のエラー状態
  const [pendingActionId, setPendingActionId] = useState<string | null>(null); //受信申請のアクションID
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null); //フレンド解除中のID
  const [sentActionId, setSentActionId] = useState<string | null>(null); //送信申請のアクションID
  const [searchTerm, setSearchTerm] = useState(""); //フレンド検索の入力値
  const [searchResults, setSearchResults] = useState<SearchUserEntry[]>([]); //フレンド検索結果
  const [searchLoading, setSearchLoading] = useState(false); //フレンド検索の読み込み状態
  const [searchError, setSearchError] = useState<string | null>(null); //フレンド検索のエラー状態
  const [searchActionId, setSearchActionId] = useState<string | null>(null); //フレンド検索のアクションID
  const [hasSearched, setHasSearched] = useState(false); //検索が行われたかどうか
  const [matchHistory, setMatchHistory] = useState<MatchRow[]>([]); //戦績一覧
  const [matchLoading, setMatchLoading] = useState(false); //戦績の読み込み状態
  const [matchError, setMatchError] = useState<string | null>(null); //戦績のエラー状態
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  // ----- ユーザー統計 -----
  const wins = user?.wins ?? 0;
  const losses = user?.losses ?? 0;
  const totalMatches = wins + losses;
  const winRate =
    totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const score = user?.user_score ?? 0;
  const getRankForScore = (value: number) => {
    let current = rankTiers[0];
    for (const tier of rankTiers) {
      if (value >= tier.min) current = tier;
    }
    return current;
  };
  const currentRank = getRankForScore(score);
  const currentRankIndex = rankTiers.findIndex(
    (tier) => tier.label === currentRank.label,
  );
  const nextRank = rankTiers[currentRankIndex + 1];
  const progressToNextRank = nextRank
    ? Math.min(
        100,
        Math.round(
          ((score - currentRank.min) / (nextRank.min - currentRank.min)) * 100,
        ),
      )
    : 100;
  const remainingForNextRank = nextRank ? Math.max(0, nextRank.min - score) : 0;
  // ----- 表示補助 -----
  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("ja-JP");
  };
  const getOnlineStatus = (lastSeen: string) => {
    const date = new Date(lastSeen);
    if (Number.isNaN(date.getTime())) {
      return { status: "offline" as const, label: "オフライン" };
    }
    const diffMs = Date.now() - date.getTime();
    const twoMinutes = 2 * 60 * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    if (diffMs <= twoMinutes) {
      return { status: "online" as const, label: "オンライン" };
    }
    if (diffMs <= fiveMinutes) {
      return { status: "away" as const, label: "離席中" };
    }
    return { status: "offline" as const, label: "オフライン" };
  };

  const buildAchievements = () => {
    const totalMatches = wins + losses;
    const achievements: AchievementRow[] = [
      {
        id: "first-win",
        title: "初勝利",
        description: "初めての勝利を達成する",
        progress: wins > 0 ? 100 : 0,
        unlocked: wins > 0,
      },
      {
        id: "ten-wins",
        title: "10勝達成",
        description: "累計10勝を達成する",
        progress: Math.min(100, Math.round((wins / 10) * 100)),
        unlocked: wins >= 10,
      },
      {
        id: "veteran",
        title: "ベテランプレイヤー",
        description: "累計50試合を達成する",
        progress: Math.min(100, Math.round((totalMatches / 50) * 100)),
        unlocked: totalMatches >= 50,
      },
      {
        id: "score-500",
        title: "スコア500",
        description: "スコアが500に到達する",
        progress: Math.min(100, Math.round((score / 500) * 100)),
        unlocked: score >= 500,
      },
    ];
    return achievements;
  };

  // ----- フレンド関連: 取得 -----
  const fetchFriends = useCallback(async () => {
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const response = await fetch(`${apiBase}/api/friendships`, {
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "フレンド一覧の取得に失敗しました";
        throw new Error(message);
      }
      setFriends(Array.isArray(data) ? (data as FriendEntry[]) : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "フレンド一覧の取得に失敗しました";
      setFriendsError(message);
    } finally {
      setFriendsLoading(false);
    }
  }, [apiBase]);

  const fetchPendingRequests = useCallback(async () => {
    setPendingLoading(true);
    setPendingError(null);
    try {
      const response = await fetch(`${apiBase}/api/friendships/pending`, {
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "受信申請の取得に失敗しました";
        throw new Error(message);
      }
      setPendingRequests(
        Array.isArray(data) ? (data as PendingRequestEntry[]) : [],
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "受信申請の取得に失敗しました";
      setPendingError(message);
    } finally {
      setPendingLoading(false);
    }
  }, [apiBase]);

  const fetchSentRequests = useCallback(async () => {
    setSentLoading(true);
    setSentError(null);
    try {
      const response = await fetch(`${apiBase}/api/friendships/pending/sent`, {
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "送信申請の取得に失敗しました";
        throw new Error(message);
      }
      setSentRequests(Array.isArray(data) ? (data as SentRequestEntry[]) : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "送信申請の取得に失敗しました";
      setSentError(message);
    } finally {
      setSentLoading(false);
    }
  }, [apiBase]);

  const fetchMatchHistory = useCallback(async () => {
    if (!user?.uuid) return;
    setMatchLoading(true);
    setMatchError(null);
    try {
      const response = await fetch(
        `${apiBase}/api/games/history/${user.uuid}?limit=20&offset=0`,
        { credentials: "include" },
      );
      const data = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "戦績の取得に失敗しました";
        throw new Error(message);
      }
      const parsed = data as MatchHistoryResponse;
      setMatchHistory(Array.isArray(parsed?.games) ? parsed.games : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "戦績の取得に失敗しました";
      setMatchError(message);
    } finally {
      setMatchLoading(false);
    }
  }, [apiBase, user?.uuid]);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const response = await fetch(
        `${apiBase}/api/users/leaderboard?limit=10&offset=0`,
        { credentials: "include" },
      );
      const data = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "ランキングの取得に失敗しました";
        throw new Error(message);
      }
      const parsed = data as LeaderboardResponse;
      setLeaderboard(Array.isArray(parsed?.entries) ? parsed.entries : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ランキングの取得に失敗しました";
      setLeaderboardError(message);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [apiBase]);

  const refreshFriendData = useCallback(async () => {
    await Promise.all([
      fetchFriends(),
      fetchPendingRequests(),
      fetchSentRequests(),
    ]);
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests]);

  // ----- フレンド関連: 初期取得 -----
  useEffect(() => {
    if (!user?.uuid) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setMatchHistory([]);
      setLeaderboard([]);
      return;
    }
    void refreshFriendData();
    void fetchMatchHistory();
    void fetchLeaderboard();
  }, [user?.uuid, refreshFriendData, fetchMatchHistory, fetchLeaderboard]);
  // ログアウト処理とトップページへのリダイレクトを行う関数
  // ----- 認証/アカウント操作 -----
  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors; still clear local state
    }
    logout();
    router.push("/");
  };

  const handleTestUpdate = async (payload: {
    result: "win" | "loss";
    score_delta: number;
  }) => {
    try {
      const response = await fetch(`${apiBase}/api/me/test-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) return;
      const data = (await response.json()) as unknown;
      setUserFromApi(data);
    } catch {
      // ignore network errors for test actions
    }
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    try {
      await fetch(`${apiBase}/api/me`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      // ignore network errors; still clear local state
    }
    logout();
    router.push("/");
  };

  // ----- フレンド関連: 操作 -----
  const handleRefreshFriends = async () => {
    if (!user?.uuid) return;
    await refreshFriendData();
  };

  const handleRespondFriendRequest = async (
    requestId: string,
    response: "accepted" | "declined",
  ) => {
    if (pendingActionId) return;
    setPendingActionId(requestId);
    setPendingError(null);
    try {
      const result = await fetch(`${apiBase}/api/friendships/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ response }),
      });
      const data = (await result.json().catch(() => null)) as unknown;
      if (!result.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "フレンド申請の処理に失敗しました";
        throw new Error(message);
      }
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
      if (response === "accepted") {
        await fetchFriends();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "フレンド申請の処理に失敗しました";
      setPendingError(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (sentActionId) return;
    setSentActionId(requestId);
    setSentError(null);
    try {
      const result = await fetch(`${apiBase}/api/friendships/${requestId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await result.json().catch(() => null)) as unknown;
      if (!result.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "申請の取り消しに失敗しました";
        throw new Error(message);
      }
      setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "申請の取り消しに失敗しました";
      setSentError(message);
    } finally {
      setSentActionId(null);
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);
    const keyword = searchTerm.trim();
    if (!keyword) {
      setSearchError("表示名を入力してください");
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await fetch(
        `${apiBase}/api/users/search?display_name=${encodeURIComponent(keyword)}`,
        { credentials: "include" },
      );
      const data = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "検索に失敗しました";
        throw new Error(message);
      }
      setSearchResults(Array.isArray(data) ? (data as SearchUserEntry[]) : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "検索に失敗しました";
      setSearchError(message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendFriendRequest = async (addresseeId: string) => {
    if (searchActionId) return;
    setSearchActionId(addresseeId);
    setSearchError(null);
    try {
      const response = await fetch(`${apiBase}/api/friendships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ addressee_id: addresseeId }),
      });
      const data = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "申請の送信に失敗しました";
        throw new Error(message);
      }
      await fetchSentRequests();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "申請の送信に失敗しました";
      setSearchError(message);
    } finally {
      setSearchActionId(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (removingFriendId) return;
    setRemovingFriendId(friendshipId);
    setFriendsError(null);
    try {
      const result = await fetch(`${apiBase}/api/friendships/${friendshipId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await result.json().catch(() => null)) as unknown;
      if (!result.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "フレンド解除に失敗しました";
        throw new Error(message);
      }
      setFriends((prev) =>
        prev.filter((friend) => friend.friendship_id !== friendshipId),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "フレンド解除に失敗しました";
      setFriendsError(message);
    } finally {
      setRemovingFriendId(null);
    }
  };

  // ----- フレンド関連: 参照用セット -----
  const friendIdSet = new Set(friends.map((friend) => friend.friend_id));
  const incomingRequestSet = new Set(
    pendingRequests.map((request) => request.requester_id),
  );
  const outgoingRequestSet = new Set(
    sentRequests.map((request) => request.addressee_id),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="friends">フレンド</TabsTrigger>
          <TabsTrigger value="stats">統計</TabsTrigger>
          <TabsTrigger value="record">戦績</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>プレイヤー情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      {user?.avatar_url ? (
                        <AvatarImage
                          src={user.avatar_url}
                          alt={user.display_name}
                        />
                      ) : null}
                      <AvatarFallback>
                        {user?.display_name?.trim()?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 rounded-full border border-background bg-background p-1">
                      <OnlineIndicator status="online" size="sm" />
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {user?.display_name ?? "Guest"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      メインサーバー
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">ランク: {currentRank.label}</Badge>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={refreshUser}
                >
                  最新情報を取得
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  ログアウト
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>概要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">勝率</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={winRate} />
                    <span className="text-sm font-semibold">{winRate}%</span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">勝利</p>
                    <p className="text-xl font-semibold">{wins}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">敗北</p>
                    <p className="text-xl font-semibold">{losses}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">スコア</p>
                    <p className="text-xl font-semibold">{score}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="friends">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">フレンド</h3>
              <p className="text-sm text-muted-foreground">
                検索・申請・受信・解除をまとめて管理できます。
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshFriends}
              disabled={pendingLoading || friendsLoading || sentLoading}
            >
              更新
            </Button>
          </div>

          <div className="mt-6 grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>フレンド一覧</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {friendsError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{friendsError}</AlertDescription>
                  </Alert>
                ) : null}
                {friendsLoading ? (
                  <p className="text-sm text-muted-foreground">読み込み中...</p>
                ) : friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    まだフレンドはいません。
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>プレイヤー</TableHead>
                        <TableHead>状態</TableHead>
                        <TableHead>スコア</TableHead>
                        <TableHead>ランク</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {friends.map((friend) => {
                        const friendRank = getRankForScore(friend.user_score);
                        const onlineStatus = getOnlineStatus(friend.last_seen);
                        return (
                          <TableRow key={friend.friendship_id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  {friend.avatar_url ? (
                                    <AvatarImage
                                      src={friend.avatar_url}
                                      alt={friend.display_name}
                                    />
                                  ) : null}
                                  <AvatarFallback>
                                    {friend.display_name
                                      .trim()?.[0]
                                      ?.toUpperCase() ?? "F"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {friend.display_name}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <OnlineIndicator
                                    status={onlineStatus.status}
                                    size="sm"
                                  />
                                  <span className="text-sm">
                                    {onlineStatus.label}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  最終: {formatDateTime(friend.last_seen)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{friend.user_score}</TableCell>
                            <TableCell>{friendRank.label}</TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    解除
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>フレンド解除</DialogTitle>
                                    <DialogDescription>
                                      {friend.display_name}{" "}
                                      をフレンドから解除しますか？
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">
                                        キャンセル
                                      </Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleRemoveFriend(
                                            friend.friendship_id,
                                          )
                                        }
                                        disabled={removingFriendId !== null}
                                      >
                                        {removingFriendId ===
                                        friend.friendship_id
                                          ? "解除中..."
                                          : "解除する"}
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>受信申請</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{pendingError}</AlertDescription>
                  </Alert>
                ) : null}
                {pendingLoading ? (
                  <p className="text-sm text-muted-foreground">読み込み中...</p>
                ) : pendingRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    受信申請はありません。
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {request.avatar_url ? (
                              <AvatarImage
                                src={request.avatar_url}
                                alt={request.display_name}
                              />
                            ) : null}
                            <AvatarFallback>
                              {request.display_name
                                .trim()?.[0]
                                ?.toUpperCase() ?? "F"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {request.display_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              申請日: {formatDateTime(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleRespondFriendRequest(request.id, "accepted")
                            }
                            disabled={pendingActionId !== null}
                          >
                            {pendingActionId === request.id
                              ? "処理中..."
                              : "承認"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRespondFriendRequest(request.id, "declined")
                            }
                            disabled={pendingActionId !== null}
                          >
                            {pendingActionId === request.id
                              ? "処理中..."
                              : "拒否"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>フレンド検索</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form
                  className="flex flex-col gap-3 sm:flex-row"
                  onSubmit={handleSearch}
                >
                  <Input
                    placeholder="表示名で検索"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <Button type="submit" disabled={searchLoading}>
                    {searchLoading ? "検索中..." : "検索"}
                  </Button>
                </form>
                {searchError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                ) : null}
                {searchLoading ? (
                  <p className="text-sm text-muted-foreground">検索中...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {hasSearched
                      ? "検索結果がありません。"
                      : "表示名を入力して検索してください。"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((result) => {
                      const isFriend = friendIdSet.has(result.uuid);
                      const isOutgoing = outgoingRequestSet.has(result.uuid);
                      const isIncoming = incomingRequestSet.has(result.uuid);
                      return (
                        <div
                          key={result.uuid}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {result.avatar_url ? (
                                <AvatarImage
                                  src={result.avatar_url}
                                  alt={result.display_name}
                                />
                              ) : null}
                              <AvatarFallback>
                                {result.display_name
                                  .trim()?.[0]
                                  ?.toUpperCase() ?? "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {result.display_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {isFriend ? (
                              <Badge variant="secondary">フレンド</Badge>
                            ) : isOutgoing ? (
                              <Badge variant="outline">送信済み</Badge>
                            ) : isIncoming ? (
                              <Badge variant="outline">受信申請あり</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSendFriendRequest(result.uuid)
                                }
                                disabled={searchActionId !== null}
                              >
                                {searchActionId === result.uuid
                                  ? "送信中..."
                                  : "申請"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>送信申請</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sentError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{sentError}</AlertDescription>
                  </Alert>
                ) : null}
                {sentLoading ? (
                  <p className="text-sm text-muted-foreground">読み込み中...</p>
                ) : sentRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    送信中の申請はありません。
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {request.avatar_url ? (
                              <AvatarImage
                                src={request.avatar_url}
                                alt={request.display_name}
                              />
                            ) : null}
                            <AvatarFallback>
                              {request.display_name
                                .trim()?.[0]
                                ?.toUpperCase() ?? "F"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {request.display_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              送信日: {formatDateTime(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRequest(request.id)}
                            disabled={sentActionId !== null}
                          >
                            {sentActionId === request.id
                              ? "取消中..."
                              : "取り消し"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ランクと進行度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">
                    現在ランク: {currentRank.label}
                  </Badge>
                  {nextRank ? (
                    <Badge variant="outline">
                      次のランク: {nextRank.label}
                    </Badge>
                  ) : (
                    <Badge variant="outline">最高ランク到達</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    次のランクまで {remainingForNextRank} スコア
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={progressToNextRank} />
                    <span className="text-sm font-semibold">
                      {progressToNextRank}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>アチーブメント</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {buildAchievements().map((achievement) => (
                    <div
                      key={achievement.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{achievement.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.unlocked ? (
                          <Badge>達成</Badge>
                        ) : (
                          <Badge variant="outline">進行中</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={achievement.progress} />
                        <span className="text-xs font-medium">
                          {achievement.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>スコアランキング</CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboardError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{leaderboardError}</AlertDescription>
                    </Alert>
                  ) : null}
                  {leaderboardLoading ? (
                    <p className="text-sm text-muted-foreground">読み込み中...</p>
                  ) : leaderboard.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      まだランキングがありません。
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>順位</TableHead>
                          <TableHead>プレイヤー</TableHead>
                          <TableHead>スコア</TableHead>
                          <TableHead>ランク</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboard.map((entry) => {
                          const rank = getRankForScore(entry.user_score);
                          return (
                            <TableRow key={entry.uuid}>
                              <TableCell>{entry.position}</TableCell>
                              <TableCell>{entry.display_name}</TableCell>
                              <TableCell>{entry.user_score}</TableCell>
                              <TableCell>{rank.label}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="record">
          <Card>
            <CardHeader>
              <CardTitle>最近の試合</CardTitle>
            </CardHeader>
            <CardContent>
              {matchError ? (
                <Alert variant="destructive">
                  <AlertDescription>{matchError}</AlertDescription>
                </Alert>
              ) : null}
              {matchLoading ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : matchHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  まだ試合履歴がありません。
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>対戦相手</TableHead>
                      <TableHead>結果</TableHead>
                      <TableHead>スコア</TableHead>
                      <TableHead>日時</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchHistory.map((match) => {
                      const isPlayer1 = match.player1_id === user?.uuid;
                      const opponentId = isPlayer1
                        ? match.player2_id
                        : match.player1_id;
                      const opponentLabel = opponentId
                        ? `${opponentId.slice(0, 8)}...`
                        : "AI/ローカル";
                      const result =
                        match.status !== "completed"
                          ? "未完了"
                          : match.winner_id === null
                          ? "引き分け"
                          : match.winner_id === user?.uuid
                          ? "勝利"
                          : "敗北";
                      const scoreText = isPlayer1
                        ? `${match.player1_score}-${match.player2_score}`
                        : `${match.player2_score}-${match.player1_score}`;
                      return (
                        <TableRow key={match.id}>
                          <TableCell>{opponentLabel}</TableCell>
                          <TableCell>{result}</TableCell>
                          <TableCell>{scoreText}</TableCell>
                          <TableCell>{formatDateTime(match.created_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>プロフィール設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">表示名</Label>
                <Input id="displayName" placeholder="Player42" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">ステータスメッセージ</Label>
                <Input id="status" placeholder="Ready to play!" />
              </div>
              <Button type="button">保存する</Button>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">テスト用更新</p>
                <p className="text-xs text-muted-foreground">
                  勝利/敗北/スコアを一時的に更新します。
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      handleTestUpdate({ result: "win", score_delta: 25 })
                    }
                  >
                    勝利 (+25)
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      handleTestUpdate({ result: "loss", score_delta: 25 })
                    }
                  >
                    敗北 (-25)
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">
                    アカウント閉鎖
                  </p>
                  <p className="text-xs text-muted-foreground">
                    この操作は取り消せません。プロフィールと戦績が削除されます。
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="mt-3 w-full">
                      アカウントを閉鎖する
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>アカウントを閉鎖しますか？</DialogTitle>
                      <DialogDescription>
                        閉鎖するとプロフィールと戦績は復元できません。
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">キャンセル</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                      >
                        閉鎖を確定する
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
