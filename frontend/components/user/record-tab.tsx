import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import type { MatchRow } from "@/lib/types/user";

interface RecordTabProps {
  matchHistory: MatchRow[];
  matchLoading: boolean;
  matchError: string | null;
  currentUserId: string | null;
  formatDateTime: (value: string) => string;
}

export function RecordTab({
  matchHistory,
  matchLoading,
  matchError,
  currentUserId,
  formatDateTime,
}: RecordTabProps) {
  return (
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
                  const isPlayer1 = match.player1_id === currentUserId;
                  const opponentId = isPlayer1
                    ? match.player2_id
                    : match.player1_id;
                  const opponentDisplayName = isPlayer1
                    ? match.player2_display_name
                    : match.player1_display_name;
                  const opponentLabel =
                    opponentDisplayName?.trim() ||
                    (opponentId ? `${opponentId.slice(0, 8)}...` : "AI/ローカル");
                  const result =
                    match.status !== "completed"
                      ? "未完了"
                      : match.winner_id === null
                      ? "引き分け"
                      : match.winner_id === currentUserId
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
  );
}
