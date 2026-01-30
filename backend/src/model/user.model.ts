//
export interface User {
  uuid: string | null;
  display_name: string; //最大文字数条件未実装
  email: string;
  password_hash: string;
  avatar_url: string | null;
  wins: number; // 累計勝利数
  losses: number; // 累計敗北数
  user_score: number; // 月間スコア用
  created_at: string; // ISO 8601
  last_seen: string; // ISO 8601
}

// 検討中の未実装項目
// export interface User {
//   intra_id: string | null;
//   intra_username: string | null;
//   oauth_access_token: string | null;
//   oauth_refresh_token: string | null;
//   elo_rating: number; // default 1000
//   consecutive_wins: number; // 連勝数
// }
