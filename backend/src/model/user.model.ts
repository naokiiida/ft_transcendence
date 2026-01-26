//
export interface User {
  id: string; // ここを表示名と同じ値にする
  email: string;
  password_hash: string;
}

// 仕様上の最終要件はこんな感じ？
// export interface User {
//   id: string; // UUID v4
//   email: string;
//   password_hash: string | null; // OAuth専用ユーザーはnull
//   display_name: string; // 最大32文字
//   avatar_url: string | null;
//   intra_id: string | null;
//   intra_username: string | null;
//   oauth_access_token: string | null;
//   oauth_refresh_token: string | null;
//   wins: number; // default 0
//   losses: number; // default 0
//   elo_rating: number; // default 1000
//   created_at: string; // ISO 8601
//   last_seen: string; // ISO 8601
// }
