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
    winsDelta?: number;
    lossesDelta?: number;
    scoreDelta?: number;
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
                <Badge variant="secondary">ランク: Platinum</Badge>
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
                    onClick={() => handleTestUpdate({ winsDelta: 1, scoreDelta: 2 })}
                  >
                    +1勝利 +2スコア
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      handleTestUpdate({ lossesDelta: 1, scoreDelta: -2 })
                    }
                  >
                    +1敗北 -2スコア
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTestUpdate({ scoreDelta: 5 })}
                  >
                    +5スコア
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTestUpdate({ scoreDelta: -5 })}
                  >
                    -5スコア
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
