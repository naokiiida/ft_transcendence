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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { resolveApiUrl } from "@/lib/utils";
import type { FormEvent } from "react";
import type {
  FriendEntry,
  MatchRow,
  PendingRequestEntry,
  SearchUserEntry,
  SentRequestEntry,
} from "@/lib/types/user";

type RankInfo = { label: string };

interface FriendsTabProps {
  friends: FriendEntry[];
  friendsLoading: boolean;
  friendsError: string | null;
  pendingRequests: PendingRequestEntry[];
  pendingLoading: boolean;
  pendingError: string | null;
  sentRequests: SentRequestEntry[];
  sentLoading: boolean;
  sentError: string | null;
  friendProfileId: string | null;
  friendProfileHistory: MatchRow[];
  friendProfileLoading: boolean;
  friendProfileError: string | null;
  removingFriendId: string | null;
  pendingActionId: string | null;
  sentActionId: string | null;
  searchTerm: string;
  searchResults: SearchUserEntry[];
  searchLoading: boolean;
  searchError: string | null;
  hasSearched: boolean;
  searchActionId: string | null;
  friendIdSet: Set<string>;
  incomingRequestSet: Set<string>;
  outgoingRequestSet: Set<string>;
  onRefreshFriends: () => void;
  onOpenFriendProfile: (friendId: string) => void;
  onCloseFriendProfile: () => void;
  onRemoveFriend: (friendshipId: string) => void;
  onRespondFriendRequest: (
    requestId: string,
    response: "accepted" | "declined",
  ) => void;
  onCancelRequest: (requestId: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSearchTermChange: (value: string) => void;
  onSendFriendRequest: (addresseeId: string) => void;
  getRankForScore: (value: number) => RankInfo;
  getOnlineStatus: (
    lastSeen: string,
  ) => { status: "online" | "away" | "offline"; label: string };
  formatDateTime: (value: string) => string;
  refreshDisabled: boolean;
}

export function FriendsTab({
  friends,
  friendsLoading,
  friendsError,
  pendingRequests,
  pendingLoading,
  pendingError,
  sentRequests,
  sentLoading,
  sentError,
  friendProfileId,
  friendProfileHistory,
  friendProfileLoading,
  friendProfileError,
  removingFriendId,
  pendingActionId,
  sentActionId,
  searchTerm,
  searchResults,
  searchLoading,
  searchError,
  hasSearched,
  searchActionId,
  friendIdSet,
  incomingRequestSet,
  outgoingRequestSet,
  onRefreshFriends,
  onOpenFriendProfile,
  onCloseFriendProfile,
  onRemoveFriend,
  onRespondFriendRequest,
  onCancelRequest,
  onSearch,
  onSearchTermChange,
  onSendFriendRequest,
  getRankForScore,
  getOnlineStatus,
  formatDateTime,
  refreshDisabled,
}: FriendsTabProps) {
  return (
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
          onClick={onRefreshFriends}
          disabled={refreshDisabled}
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
                                  src={resolveApiUrl(friend.avatar_url)}
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
                            {onlineStatus.status !== "online" && (
                              <span className="text-xs text-muted-foreground">
                                最終: {formatDateTime(friend.last_seen)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{friend.user_score}</TableCell>
                        <TableCell>{friendRank.label}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog
                              onOpenChange={(open) => {
                                if (open) {
                                  onOpenFriendProfile(friend.friend_id);
                                } else {
                                  onCloseFriendProfile();
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  プロフィール
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    {friend.display_name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    フレンドのプロフィール情報です。
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    {friend.avatar_url ? (
                                      <AvatarImage
                                        src={resolveApiUrl(friend.avatar_url)}
                                        alt={friend.display_name}
                                      />
                                    ) : null}
                                    <AvatarFallback>
                                      {friend.display_name
                                        .trim()?.[0]
                                        ?.toUpperCase() ?? "F"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                      スコア
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {friend.user_score}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      ランク: {friendRank.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      最終: {formatDateTime(friend.last_seen)}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">
                                    最近の戦績
                                  </p>
                                  {friendProfileId !== friend.friend_id ? (
                                    <p className="text-sm text-muted-foreground">
                                      読み込み中...
                                    </p>
                                  ) : friendProfileError ? (
                                    <Alert variant="destructive">
                                      <AlertDescription>
                                        {friendProfileError}
                                      </AlertDescription>
                                    </Alert>
                                  ) : friendProfileLoading ? (
                                    <p className="text-sm text-muted-foreground">
                                      読み込み中...
                                    </p>
                                  ) : friendProfileHistory.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                      まだ戦績はありません。
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {friendProfileHistory.map((match) => {
                                        const isPlayer1 =
                                          match.player1_id === friend.friend_id;
                                        const opponentId = isPlayer1
                                          ? match.player2_id
                                          : match.player1_id;
                                        const friendScore = isPlayer1
                                          ? match.player1_score
                                          : match.player2_score;
                                        const opponentScore = isPlayer1
                                          ? match.player2_score
                                          : match.player1_score;
                                        const result = match.winner_id
                                          ? match.winner_id === friend.friend_id
                                            ? "勝ち"
                                            : "負け"
                                          : "中断";
                                        const opponentDisplayName = isPlayer1
                                          ? match.player2_display_name
                                          : match.player1_display_name;
                                        const opponentLabel =
                                          opponentDisplayName?.trim() ||
                                          (opponentId
                                            ? `${opponentId.slice(0, 8)}...`
                                            : "AI/ローカル");
                                        return (
                                          <div
                                            key={match.id}
                                            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                                          >
                                            <div>
                                              <p className="font-medium">
                                                {result}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                vs {opponentLabel}
                                              </p>
                                            </div>
                                            <div className="text-sm font-mono">
                                              {friendScore} - {opponentScore}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">閉じる</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
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
                                    <Button variant="outline">キャンセル</Button>
                                  </DialogClose>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      onRemoveFriend(friend.friendship_id)
                                    }
                                    disabled={removingFriendId !== null}
                                  >
                                    {removingFriendId === friend.friendship_id
                                      ? "解除中..."
                                      : "解除する"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
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
                            src={resolveApiUrl(request.avatar_url)}
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
                        <p className="font-medium">{request.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          申請日: {formatDateTime(request.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          onRespondFriendRequest(request.id, "accepted")
                        }
                        disabled={pendingActionId !== null}
                      >
                        {pendingActionId === request.id ? "処理中..." : "承認"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onRespondFriendRequest(request.id, "declined")
                        }
                        disabled={pendingActionId !== null}
                      >
                        {pendingActionId === request.id ? "処理中..." : "拒否"}
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
              onSubmit={onSearch}
            >
              <Input
                placeholder="表示名で検索"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
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
                              src={resolveApiUrl(result.avatar_url)}
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
                          <p className="font-medium">{result.display_name}</p>
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
                            onClick={() => onSendFriendRequest(result.uuid)}
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
                            src={resolveApiUrl(request.avatar_url)}
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
                        <p className="font-medium">{request.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          送信日: {formatDateTime(request.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancelRequest(request.id)}
                        disabled={sentActionId !== null}
                      >
                        {sentActionId === request.id ? "取消中..." : "取り消し"}
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
  );
}
