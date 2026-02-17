import { OnlineIndicator } from "@/components/shared/online-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TabsContent } from "@/components/ui/tabs";

interface ProfileTabProps {
  displayName: string;
  avatarUrl: string | null;
  currentRankLabel: string;
  winRate: number;
  wins: number;
  losses: number;
  score: number;
  onRefresh: () => void;
  onLogout: () => void;
}

export function ProfileTab({
  displayName,
  avatarUrl,
  currentRankLabel,
  winRate,
  wins,
  losses,
  score,
  onRefresh,
  onLogout,
}: ProfileTabProps) {
  return (
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
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback>
                    {displayName.trim()?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 rounded-full border border-background bg-background p-1">
                  <OnlineIndicator status="online" size="sm" />
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">メインサーバー</p>
              </div>
            </div>
            <Badge variant="secondary">ランク: {currentRankLabel}</Badge>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={onRefresh}
            >
              最新情報を取得
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onLogout}
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
  );
}
