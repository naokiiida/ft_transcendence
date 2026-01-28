"use client";

import { OnlineIndicator } from "@/components/shared/online-indicator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function UserPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* 基本プロフィール（現状で表示できる情報のみ） */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border border-primary/40 shadow">
                    <AvatarImage src="" alt="KIRIN-01" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      KR
                    </AvatarFallback>
                  </Avatar>
                  {/* オンライン状態のインジケーター */}
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-card p-1">
                    <OnlineIndicator status="online" size="md" />
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold">KIRIN-01</h1>
                    <Badge variant="success">オンライン</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    自己紹介はまだ設定されていません。
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    登録: 2024/05/01
                  </div>
                </div>
              </div>
              {/* 実績が未確定でも出せる簡易ステータス */}
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">ELO</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">戦績</p>
                  <p className="text-lg font-semibold">0W / 0L</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">トーナメント</p>
                  <p className="text-lg font-semibold">未参加</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 対戦履歴がない状態のガイド */}
        <Card>
          <CardHeader>
            <CardTitle>最近の対戦</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>対戦履歴はまだありません</AlertTitle>
              <AlertDescription>
                クイックマッチやAI対戦を行うと履歴が追加されます。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
