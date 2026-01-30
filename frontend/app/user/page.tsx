"use client";

import { OnlineIndicator } from "@/components/shared/online-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/components/auth/user-context";
import { useRouter } from "next/navigation";
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

// ユーザーページ
export default function UserPage() {
  // UseUserからログアウト関数を取得
  const { logout } = useUser();
  // ルーターを取得
  const router = useRouter();
  // ログアウト処理とトップページへのリダイレクトを行う関数
  const handleLogout = () => {
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
                      <AvatarImage src="" alt="User avatar" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 rounded-full border border-background bg-background p-1">
                      <OnlineIndicator status="online" size="sm" />
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Player42</p>
                    <p className="text-sm text-muted-foreground">
                      メインサーバー
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">ランク: Platinum</Badge>
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
                    <Progress value={68} />
                    <span className="text-sm font-semibold">68%</span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">勝利</p>
                    <p className="text-xl font-semibold">24</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">敗北</p>
                    <p className="text-xl font-semibold">11</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">連勝</p>
                    <p className="text-xl font-semibold">5</p>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
