import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import type { AchievementRow, LeaderboardEntry } from "@/lib/types/user";

type RankInfo = { label: string };

interface StatsTabProps {
  currentRankLabel: string;
  nextRankLabel: string | null;
  remainingForNextRank: number;
  progressToNextRank: number;
  achievements: AchievementRow[];
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  getRankForScore: (value: number) => RankInfo;
}

export function StatsTab({
  currentRankLabel,
  nextRankLabel,
  remainingForNextRank,
  progressToNextRank,
  achievements,
  leaderboard,
  leaderboardLoading,
  leaderboardError,
  getRankForScore,
}: StatsTabProps) {
  return (
    <TabsContent value="stats">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ランクと進行度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">現在ランク: {currentRankLabel}</Badge>
              {nextRankLabel ? (
                <Badge variant="outline">次のランク: {nextRankLabel}</Badge>
              ) : (
                <Badge variant="outline">最高ランク到達</Badge>
              )}
            </div>
            {nextRankLabel ? (
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
            ) : null}
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
  );
}
