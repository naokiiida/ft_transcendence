import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDatabase } from '../db/database';
import type {
  Game,
  GameStatus,
  CreateGameInput,
  StartGameInput,
  FinishGameInput,
} from '../model/game.model';

@Injectable()
export class GamesService {
  /**
   * 新規ゲームを作成
   * player2_id 指定なし → waiting、指定あり → playing
   */
  create(input: CreateGameInput): Game {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();
    const status: GameStatus = input.player2_id ? 'playing' : 'waiting';

    const stmt = db.prepare(`
      INSERT INTO games (id, player1_id, player2_id, status, created_at)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);

    try {
      return stmt.get(id, input.player1_id, input.player2_id ?? null, status, now) as Game;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('FOREIGN KEY constraint failed')
      ) {
        throw new BadRequestException('Invalid player ID');
      }
      throw error;
    }
  }

  /**
   * IDでゲームを検索
   */
  findById(id: string): Game | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
    const row = stmt.get(id) as Game | undefined;
    return row ?? null;
  }

  /**
   * IDでゲームを検索（存在しない場合は例外）
   */
  findByIdOrThrow(id: string): Game {
    const game = this.findById(id);
    if (!game) {
      throw new NotFoundException(`Game not found: ${id}`);
    }
    return game;
  }

  /**
   * プレイヤーの試合履歴を取得
   */
  findByPlayerId(
    playerId: string,
    options?: { status?: GameStatus; limit?: number; offset?: number },
  ): Game[] {
    const db = getDatabase();
    const params: (string | number)[] = [playerId, playerId];
    let sql = 'SELECT * FROM games WHERE (player1_id = ? OR player2_id = ?)';

    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = db.prepare(sql);
    return stmt.all(...params) as Game[];
  }

  /**
   * 待機中ゲーム一覧（マッチメイキング用、FIFO順）
   */
  findWaitingGames(): Game[] {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT * FROM games WHERE status = 'waiting' ORDER BY created_at ASC",
    );
    return stmt.all() as Game[];
  }

  /**
   * ゲーム開始: player2 が参加して playing 状態へ
   */
  start(id: string, input: StartGameInput): Game {
    const game = this.findByIdOrThrow(id);

    if (game.status !== 'waiting') {
      throw new ConflictException(
        `Game is not in waiting status: ${game.status}`,
      );
    }
    if (game.player1_id === input.player2_id) {
      throw new BadRequestException('Cannot play against yourself');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE games SET player2_id = ?, status = 'playing'
      WHERE id = ?
      RETURNING *
    `);

    try {
      return stmt.get(input.player2_id, id) as Game;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('FOREIGN KEY constraint failed')
      ) {
        throw new BadRequestException('Invalid player2 ID');
      }
      throw error;
    }
  }

  /**
   * スコア変動を計算する
   * 勝者と敗者の現在のスコアに基づいて、それぞれの変動値を返す
   *
   * TODO: 現在は固定値。ELOレーティング等に変更する場合はここを修正
   */
  calculateScoreChange(
    _winnerScore: number,
    _loserScore: number,
  ): { winnerDelta: number; loserDelta: number } {
    return { winnerDelta: 25, loserDelta: -25 };
  }

  /**
   * ゲーム終了: スコアと勝者を記録し、プレイヤーのstatsを更新
   * トランザクション内でゲーム更新とstats更新を原子的に実行
   */
  finish(id: string, input: FinishGameInput): Game {
    const game = this.findByIdOrThrow(id);

    if (game.status !== 'playing') {
      throw new ConflictException(
        `Game is not in playing status: ${game.status}`,
      );
    }
    if (
      input.winner_id !== game.player1_id &&
      input.winner_id !== game.player2_id
    ) {
      throw new BadRequestException('Winner must be one of the players');
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const loserId =
      input.winner_id === game.player1_id
        ? game.player2_id
        : game.player1_id;

    // 勝者・敗者の現在のスコアを取得してスコア変動を計算
    const winnerRow = db
      .prepare('SELECT user_score FROM users WHERE uuid = ?')
      .get(input.winner_id) as { user_score: number } | undefined;
    const loserRow = loserId
      ? (db
          .prepare('SELECT user_score FROM users WHERE uuid = ?')
          .get(loserId) as { user_score: number } | undefined)
      : undefined;

    const { winnerDelta, loserDelta } = this.calculateScoreChange(
      winnerRow?.user_score ?? 1000,
      loserRow?.user_score ?? 1000,
    );

    // トランザクションでゲーム更新 + stats更新を原子的に実行
    const finishTransaction = db.transaction(() => {
      const updatedGame = db
        .prepare(
          `UPDATE games
           SET winner_id = ?, player1_score = ?, player2_score = ?,
               status = 'finished', finished_at = ?
           WHERE id = ?
           RETURNING *`,
        )
        .get(input.winner_id, input.player1_score, input.player2_score, now, id) as Game;

      // 勝者: wins+1, user_score + winnerDelta
      db.prepare(
        'UPDATE users SET wins = wins + 1, user_score = user_score + ? WHERE uuid = ?',
      ).run(winnerDelta, input.winner_id);

      // 敗者: losses+1, user_score + loserDelta (最低0)
      if (loserId) {
        db.prepare(
          'UPDATE users SET losses = losses + 1, user_score = MAX(0, user_score + ?) WHERE uuid = ?',
        ).run(loserDelta, loserId);
      }

      return updatedGame;
    });

    return finishTransaction();
  }

  /**
   * ゲームキャンセル（stats更新なし）
   */
  cancel(id: string): Game {
    const game = this.findByIdOrThrow(id);

    if (game.status === 'finished' || game.status === 'cancelled') {
      throw new ConflictException(`Game already ${game.status}`);
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE games SET status = 'cancelled'
      WHERE id = ?
      RETURNING *
    `);

    return stmt.get(id) as Game;
  }

  /**
   * ゲーム削除（RETURNING句で1操作、UsersServiceパターンに準拠）
   */
  deleteById(id: string): Game | null {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM games WHERE id = ? RETURNING *');
    const row = stmt.get(id) as Game | undefined;
    return row ?? null;
  }
}
