"use client";

import { useUser } from "@/components/auth/user-context";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGate } from "@/components/auth/auth-gate";
import { ProfileTab } from "@/components/user/profile-tab";
import { FriendsTab } from "@/components/user/friends-tab";
import { StatsTab } from "@/components/user/stats-tab";
import { RecordTab } from "@/components/user/record-tab";
import { SettingsTab } from "@/components/user/settings-tab";
import { getRankForScore, rankTiers } from "@/lib/game/rank";
import { useBallColorByRankEnabled } from "@/lib/game/preferences";
import type {
  AchievementRow,
  FriendEntry,
  LeaderboardEntry,
  LeaderboardResponse,
  MatchHistoryResponse,
  MatchRow,
  PendingRequestEntry,
  SearchUserEntry,
  SentRequestEntry,
} from "@/lib/types/user";

/*
フレンドのオンライン、オフライン認定
2分以内にAPI利用で、オンライン（last_seenの利用実績に合わせる）
2から5分は離席扱い、5分以上で離席扱い。




*/


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
  const [activeTab, setActiveTab] = useState("profile");
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
  const [friendProfileId, setFriendProfileId] = useState<string | null>(null);
  const [friendProfileHistory, setFriendProfileHistory] = useState<MatchRow[]>(
    [],
  );
  const [friendProfileLoading, setFriendProfileLoading] = useState(false);
  const [friendProfileError, setFriendProfileError] = useState<string | null>(
    null,
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  // ----- プロフィール設定 -----
  const [editDisplayName, setEditDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [ballColorByRankEnabled, setBallColorByRankEnabled] =
    useBallColorByRankEnabled();
  // ----- ユーザー統計 -----
  const wins = user?.wins ?? 0;
  const losses = user?.losses ?? 0;
  const totalMatches = wins + losses;
  const winRate =
    totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const score = user?.user_score ?? 0;
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
  const fetchFriends = useCallback(async (silent = false) => {
    if (!silent) {
      setFriendsLoading(true);
      setFriendsError(null);
    }
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
      if (!silent) {
        const message =
          err instanceof Error ? err.message : "フレンド一覧の取得に失敗しました";
        setFriendsError(message);
      }
    } finally {
      if (!silent) setFriendsLoading(false);
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

  const fetchFriendMatchHistory = useCallback(
    async (friendId: string) => {
      setFriendProfileLoading(true);
      setFriendProfileError(null);
      try {
        const response = await fetch(
          `${apiBase}/api/games/history/${friendId}?limit=5&offset=0`,
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
        setFriendProfileHistory(
          Array.isArray(parsed?.games) ? parsed.games : [],
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "戦績の取得に失敗しました";
        setFriendProfileError(message);
      } finally {
        setFriendProfileLoading(false);
      }
    },
    [apiBase],
  );

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

  // ----- フレンドタブ表示中のポーリング (30秒間隔) -----
  useEffect(() => {
    if (activeTab !== "friends" || !user?.uuid) return;
    const intervalId = setInterval(() => {
      void fetchFriends(true);
    }, 30_000);
    return () => clearInterval(intervalId);
  }, [activeTab, user?.uuid, fetchFriends]);

  const openFriendProfile = (friendId: string) => {
    setFriendProfileId(friendId);
    setFriendProfileHistory([]);
    void fetchFriendMatchHistory(friendId);
  };

  const closeFriendProfile = () => {
    setFriendProfileId(null);
    setFriendProfileHistory([]);
    setFriendProfileError(null);
  };
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

  // ----- プロフィール設定: 初期値と保存 -----
  useEffect(() => {
    if (user?.display_name) {
      setEditDisplayName(user.display_name);
    }
  }, [user?.display_name]);

  const handleSaveProfile = async () => {
    if (profileSaving) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const response = await fetch(`${apiBase}/api/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ display_name: editDisplayName.trim() }),
      });
      const data = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          (data as { message?: string } | null)?.message ??
          "プロフィールの更新に失敗しました";
        throw new Error(message);
      }
      setUserFromApi(data);
      setProfileSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "プロフィールの更新に失敗しました";
      setProfileError(message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDisplayNameChange = (value: string) => {
    setEditDisplayName(value);
    setProfileSuccess(false);
    setProfileError(null);
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleToggleBallColorByRank = () => {
    setBallColorByRankEnabled(!ballColorByRankEnabled);
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
  const friendIdSet = useMemo(
    () => new Set(friends.map((friend) => friend.friend_id)),
    [friends],
  );
  const incomingRequestSet = useMemo(
    () => new Set(pendingRequests.map((request) => request.requester_id)),
    [pendingRequests],
  );
  const outgoingRequestSet = useMemo(
    () => new Set(sentRequests.map((request) => request.addressee_id)),
    [sentRequests],
  );
  const displayName = user?.display_name ?? "Guest";
  const avatarDisplayName = user?.display_name ?? "U";
  const avatarUrl = user?.avatar_url ?? null;
  const achievements = buildAchievements();
  const refreshDisabled = pendingLoading || friendsLoading || sentLoading;
  const currentUserId = user?.uuid ?? null;

  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    }>
      <AuthGate>
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
            <TabsTrigger value="friends">フレンド</TabsTrigger>
            <TabsTrigger value="stats">統計</TabsTrigger>
            <TabsTrigger value="record">戦績</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>

          <ProfileTab
            displayName={displayName}
            avatarUrl={avatarUrl}
            currentRankLabel={currentRank.label}
            winRate={winRate}
            wins={wins}
            losses={losses}
            score={score}
            onRefresh={refreshUser}
            onLogout={handleLogout}
          />

          <FriendsTab
            friends={friends}
            friendsLoading={friendsLoading}
            friendsError={friendsError}
            pendingRequests={pendingRequests}
            pendingLoading={pendingLoading}
            pendingError={pendingError}
            sentRequests={sentRequests}
            sentLoading={sentLoading}
            sentError={sentError}
            friendProfileId={friendProfileId}
            friendProfileHistory={friendProfileHistory}
            friendProfileLoading={friendProfileLoading}
            friendProfileError={friendProfileError}
            removingFriendId={removingFriendId}
            pendingActionId={pendingActionId}
            sentActionId={sentActionId}
            searchTerm={searchTerm}
            searchResults={searchResults}
            searchLoading={searchLoading}
            searchError={searchError}
            hasSearched={hasSearched}
            searchActionId={searchActionId}
            friendIdSet={friendIdSet}
            incomingRequestSet={incomingRequestSet}
            outgoingRequestSet={outgoingRequestSet}
            onRefreshFriends={handleRefreshFriends}
            onOpenFriendProfile={openFriendProfile}
            onCloseFriendProfile={closeFriendProfile}
            onRemoveFriend={handleRemoveFriend}
            onRespondFriendRequest={handleRespondFriendRequest}
            onCancelRequest={handleCancelRequest}
            onSearch={handleSearch}
            onSearchTermChange={handleSearchTermChange}
            onSendFriendRequest={handleSendFriendRequest}
            getRankForScore={getRankForScore}
            getOnlineStatus={getOnlineStatus}
            formatDateTime={formatDateTime}
            refreshDisabled={refreshDisabled}
          />

          <StatsTab
            currentRankLabel={currentRank.label}
            nextRankLabel={nextRank?.label ?? null}
            remainingForNextRank={remainingForNextRank}
            progressToNextRank={progressToNextRank}
            achievements={achievements}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            leaderboardError={leaderboardError}
            getRankForScore={getRankForScore}
          />

          <RecordTab
            matchHistory={matchHistory}
            matchLoading={matchLoading}
            matchError={matchError}
            currentUserId={currentUserId}
            formatDateTime={formatDateTime}
          />

          <SettingsTab
            avatarUrl={avatarUrl}
            avatarDisplayName={avatarDisplayName}
            editDisplayName={editDisplayName}
            profileSaving={profileSaving}
            profileError={profileError}
            profileSuccess={profileSuccess}
            onDisplayNameChange={handleDisplayNameChange}
            ballColorByRankEnabled={ballColorByRankEnabled}
            onToggleBallColorByRank={handleToggleBallColorByRank}
            onSaveProfile={handleSaveProfile}
            onDeleteAccount={handleDeleteAccount}
            deletingAccount={deletingAccount}
            onAvatarUploadSuccess={setUserFromApi}
          />
        </Tabs>
      </div>
      </AuthGate>
    </Suspense>
  );
}
