/**
 * User エンティティ
 * data-model.md のスキーマに準拠
 * フィールド名はフロントエンドに統一: id→uuid, elo_rating→user_score
 */
export interface User {
  uuid: string; // UUID v4
  email: string;
  password_hash: string | null; // OAuth専用ユーザーはnull
  display_name: string; // 最大32文字
  avatar_url: string | null;
  intra_id: string | null; // 42 intra ID
  intra_username: string | null; // 42 login
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
  wins: number; // default 0
  losses: number; // default 0
  user_score: number; // default 1000 (旧: elo_rating)
  created_at: string; // ISO 8601
  last_seen: string; // ISO 8601
  method: 'email' | 'intra';
}

/**
 * ユーザー作成時の入力データ
 * 必須フィールドのみ + オプショナルフィールド
 */
export type CreateUserInput = CreateEmailUserInput | CreateIntraUserInput;

/** メール認証でのユーザー作成 */
export interface CreateEmailUserInput {
  method: 'email'; // リテラル型（判別子）
  email: string;
  password_hash: string;
  display_name: string;
}

/** OAuth認証でのユーザー作成 */
export interface CreateIntraUserInput {
  method: 'intra'; // リテラル型（判別子）
  email: string;
  intra_id: string;
  intra_username: string;
  display_name: string;
}

/**
 * 公開プロフィール（パスワードやトークンを除外）
 */
export type PublicUser = Omit<
  User,
  'password_hash' | 'oauth_access_token' | 'oauth_refresh_token'
>;
