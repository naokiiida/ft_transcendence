"use client";

import { OnlineIndicator } from "@/components/shared/online-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const matchHistory = [
  {
    opponent: "プレイヤーA",
    result: "勝利",
    score: "11-8",
    date: "2024-04-08",
  },
  {
    opponent: "プレイヤーB",
    result: "敗北",
    score: "7-11",
    date: "2024-04-06",
  },
  {
    opponent: "プレイヤーC",
    result: "勝利",
    score: "11-9",
    date: "2024-04-02",
  },
];

const friends = [
  {
    id: 1,
    name: "Rina",
    status: "online" as const,
    wins: 12,
    losses: 5,
  },
  {
    id: 2,
    name: "Ken",
    status: "in-game" as const,
    wins: 8,
    losses: 9,
  },
  {
    id: 3,
    name: "Sora",
    status: "away" as const,
    wins: 21,
    losses: 11,
  },
  {
    id: 4,
    name: "Mika",
    status: "offline" as const,
    wins: 4,
    losses: 2,
  },
];

const achievements = [
  {
    id: "first-win",
    title: "初勝利",
    description: "初めての勝利を達成する",
    progress: 100,
    unlocked: true,
  },
  {
    id: "ten-wins",
    title: "10勝達成",
    description: "累計10勝を達成する",
    progress: 70,
    unlocked: false,
  },
  {
    id: "win-streak",
    title: "連勝街道",
    description: "3連勝を達成する",
    progress: 40,
    unlocked: false,
  },
];

const scoreRanking = [
  { position: 1, name: "PlayerOne", score: 480 },
  { position: 2, name: "ShadowAce", score: 420 },
  { position: 3, name: "Kaito", score: 395 },
  { position: 4, name: "Luna", score: 350 },
  { position: 5, name: "Ritsu", score: 315 },
];

const rankTiers = [
  { label: "Bronze", min: 0 },
  { label: "Silver", min: 100 },
  { label: "Gold", min: 200 },
  { label: "Platinum", min: 300 },
  { label: "Diamond", min: 450 },
];

/*
サーバーのログアウトが失敗しても、フロントエンド側の状態はクリアする。
だが、厳密に、サーバー側のセッションを削除できなかった場合、
ログアウト失敗時は、エラー表示して残るのも手。
*/
// ユーザーページ
export default function UserPage() {
  // UseUserからログアウト関数を取得
  const { user, logout, refreshUser, setUserFromApi } = useUser();
  // ルーターを取得
  const router = useRouter();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const wins = user?.wins ?? 0;
  const losses = user?.losses ?? 0;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
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
    (tier) => tier.label === currentRank.label
  );
  const nextRank = rankTiers[currentRankIndex + 1];
  const progressToNextRank = nextRank
    ? Math.min(
        100,
        Math.round(
          ((score - currentRank.min) / (nextRank.min - currentRank.min)) * 100
        )
      )
    : 100;
  const remainingForNextRank = nextRank
    ? Math.max(0, nextRank.min - score)
    : 0;
  // ログアウト処理とトップページへのリダイレクトを行う関数
  const handleLogout = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
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
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
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
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
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
                        <AvatarImage src={user.avatar_url} alt={user.display_name} />
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
                    <p className="text-xl font-semibold">
                      {user?.user_score ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>フレンド一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>プレイヤー</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>戦績</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {friends.map((friend) => (
                    <TableRow key={friend.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {friend.name.trim()?.[0]?.toUpperCase() ?? "F"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friend.name}</p>
                            <p className="text-xs text-muted-foreground">
                              最近の試合: {friend.wins + friend.losses}戦
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <OnlineIndicator status={friend.status} size="sm" />
                          <span className="text-sm capitalize">
                            {friend.status.replace("-", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {friend.wins}勝 {friend.losses}敗
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          プロフィール
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ランクと進行度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">現在ランク: {currentRank.label}</Badge>
                  {nextRank ? (
                    <Badge variant="outline">次のランク: {nextRank.label}</Badge>
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
                  {achievements.map((achievement) => (
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
                      {scoreRanking.map((entry) => {
                        const rank = getRankForScore(entry.score);
                        return (
                          <TableRow key={entry.position}>
                            <TableCell>{entry.position}</TableCell>
                            <TableCell>{entry.name}</TableCell>
                            <TableCell>{entry.score}</TableCell>
                            <TableCell>{rank.label}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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
                  {matchHistory.map((match) => (
                    <TableRow key={`${match.opponent}-${match.date}`}>
                      <TableCell>{match.opponent}</TableCell>
                      <TableCell>{match.result}</TableCell>
                      <TableCell>{match.score}</TableCell>
                      <TableCell>{match.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    onClick={() => handleTestUpdate({ result: "win", score_delta: 25 })}
                  >
                    勝利 (+25)
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleTestUpdate({ result: "loss", score_delta: 25 })}
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
