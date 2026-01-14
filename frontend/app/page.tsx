import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Gamepad2, Trophy, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <div className="flex flex-col items-center justify-center gap-8 px-4 py-16">
        <Logo size="lg" />
        <p className="text-center text-lg text-muted-foreground">
          リアルタイムマルチプレイヤー Pong とトーナメント
        </p>

        <div className="flex gap-4">
          <Button size="lg" className="glow-primary" asChild>
            <Link href="/game">
              <Gamepad2 className="mr-2 h-5 w-5" />
              クイックマッチ
            </Link>
          </Button>
          <Button size="lg" variant="secondary">
            <Bot className="mr-2 h-5 w-5" />
            AI対戦
          </Button>
        </div>

        <div className="flex gap-2">
          <Badge variant="default">Next.js 15</Badge>
          <Badge variant="secondary">React 19</Badge>
          <Badge variant="outline">shadcn/ui</Badge>
        </div>
      </div>

      {/* 機能紹介 */}
      <div className="mx-auto grid max-w-4xl gap-6 px-4 pb-16 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              マルチプレイヤー
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            低遅延WebSocket接続で、世界中のプレイヤーと対戦できます。
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              トーナメント
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            シングルエリミネーション形式のトーナメントに参加。ブラケット追跡とリーダーボード機能付き。
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-secondary" />
              AI対戦
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            3段階の難易度設定と思考プロセスの可視化機能を備えたAIと練習できます。
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
