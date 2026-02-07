/**
 * Game エンティティ
 * data-model.md のスキーマに準拠
 */
export interface Game {
  id: string; // UUID v4
  player1_id: string; // users.uuid への外部キー
  player2_id: string | null; // 待機中は null
  winner_id: string | null; // 終了前は null
  player1_score: number; // default 0
  player2_score: number; // default 0
  status: GameStatus;
  created_at: string; // ISO 8601
  finished_at: string | null; // 終了前は null
}

export type GameStatus = 'waiting' | 'playing' | 'finished' | 'cancelled';

/**
 * ゲーム作成時の入力データ
 */
export interface CreateGameInput {
  player1_id: string;
  player2_id?: string; // 指定なしで waiting 状態
}

/**
 * ゲーム開始時の入力データ（player2 参加）
 */
export interface StartGameInput {
  player2_id: string;
}

/**
 * ゲーム終了時の入力データ
 */
export interface FinishGameInput {
  winner_id: string;
  player1_score: number;
  player2_score: number;
}
