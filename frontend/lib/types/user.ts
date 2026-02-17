// 試合の1レコード（DBやAPIの行データ）。
export type MatchRow = {
  id: string; // 試合ID
  player1_id: string; // 参加者1のユーザーID
  player2_id: string | null; // 参加者2のユーザーID（未確定ならnull）
  winner_id: string | null; // 勝者のユーザーID（未確定ならnull）
  player1_score: number; // 参加者1の得点
  player2_score: number; // 参加者2の得点
  created_at: string; // 作成日時（ISO文字列想定）
  status: string; // 例: "pending" / "ongoing" / "finished" など
  player1_display_name?: string | null; // 参加者1の表示名（あれば）
  player2_display_name?: string | null; // 参加者2の表示名（あれば）
};

// 試合履歴APIのレスポンス形式。
export type MatchHistoryResponse = {
  games: MatchRow[]; // 試合の配列
  total: number; // 全件数
  limit: number; // 1ページあたりの件数
  offset: number; // 取得開始位置
};

// 実績（アチーブメント）の1件。
export type AchievementRow = {
  id: string; // 実績ID
  title: string; // 実績タイトル
  description: string; // 実績の説明文
  progress: number; // 進捗値（%やカウントなど）
  unlocked: boolean; // 達成済みかどうか
};

// ランキングの1件。
export type LeaderboardEntry = {
  uuid: string; // ユーザーID
  display_name: string; // 表示名
  avatar_url: string | null; // アバター画像URL（未設定ならnull）
  user_score: number; // スコア
  position: number; // 順位
};

// ランキングAPIのレスポンス形式。
export type LeaderboardResponse = {
  entries: LeaderboardEntry[]; // ランキングの配列
  total: number; // 全件数
  limit: number; // 1ページあたりの件数
  offset: number; // 取得開始位置
};

// フレンド一覧の1件。
export type FriendEntry = {
  friendship_id: string; // フレンド関係ID
  friend_id: string; // 相手ユーザーID
  display_name: string; // 相手の表示名
  avatar_url: string | null; // 相手のアバターURL（未設定ならnull）
  user_score: number; // 相手のスコア
  last_seen: string; // 最終オンライン日時（ISO文字列想定）
};

// 受信中のフレンド申請。
export type PendingRequestEntry = {
  id: string; // 申請ID
  requester_id: string; // 申請したユーザーのID
  display_name: string; // 申請者の表示名
  avatar_url: string | null; // 申請者のアバターURL
  created_at: string; // 申請日時（ISO文字列想定）
};

// 送信済みのフレンド申請。
export type SentRequestEntry = {
  id: string; // 申請ID
  addressee_id: string; // 申請先ユーザーのID
  display_name: string; // 申請先の表示名
  avatar_url: string | null; // 申請先のアバターURL
  created_at: string; // 申請日時（ISO文字列想定）
};

// ユーザー検索結果の1件。
export type SearchUserEntry = {
  uuid: string; // ユーザーID
  display_name: string; // 表示名
  avatar_url: string | null; // アバターURL（未設定ならnull）
};
