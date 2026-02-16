import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, or, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { getDatabase } from '../db/database';
import { games, users } from '../db/schema';
import {
  createGameSchema,
  completeGameSchema,
  type Game,
  type CreateGameInput,
  type CompleteGameInput,
} from '../model/game.model';

const SCORE_PER_GAME = 25;

@Injectable()
export class GamesService {
  /**
   * ゲームを作成する
   * game_type に応じて必要なフィールドが変わる（discriminated union）
   */
  createGame(input: CreateGameInput): Game {
    const parsed = createGameSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid game input');
    }
    const data = parsed.data;

    const db = getDatabase();

    const values = {
      player1_id: data.player1_id,
      player2_id: data.game_type === 'online' ? data.player2_id : null,
      game_type: data.game_type,
      ai_difficulty: data.game_type === 'ai' ? data.ai_difficulty : null,
      status: 'waiting' as const,
    };

    return db.insert(games).values(values).returning().get();
  }

  /**
   * ゲームIDで検索
   */
  findById(gameId: string): Game | null {
    const db = getDatabase();
    return db.select().from(games).where(eq(games.id, gameId)).get() ?? null;
  }

  /**
   * ゲームを完了する — games UPDATE + users wins/losses/score UPDATE を1トランザクション
   *
   * wins/losses/score の更新は online のみ（ai/local はランキング影響なし）
   */
  completeGame(input: CompleteGameInput): Game {
    const parsed = completeGameSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid completion input');
    }
    const data = parsed.data;

    const db = getDatabase();

    return db.transaction((tx) => {
      // TOCTOU防止: トランザクション内でゲームを取得
      const game = tx.select().from(games).where(eq(games.id, data.game_id)).get();
      if (!game) {
        throw new NotFoundException('Game not found');
      }

      // 状態遷移チェック: playing → completed のみ許可
      if (game.status !== 'playing') {
        throw new BadRequestException(`Cannot complete game in '${game.status}' status`);
      }

      // winner_id が player1_id または player2_id のいずれかであることを検証
      if (data.winner_id && data.winner_id !== game.player1_id && data.winner_id !== game.player2_id) {
        throw new BadRequestException('winner_id must be one of the players');
      }

      // 1. games テーブルを更新
      const completed = tx
        .update(games)
        .set({
          winner_id: data.winner_id,
          player1_score: data.player1_score,
          player2_score: data.player2_score,
          score_delta: game.game_type === 'online' && data.winner_id ? SCORE_PER_GAME : null,
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .where(eq(games.id, data.game_id))
        .returning()
        .get();

      // 2. users テーブルの wins/losses/score を更新（online のみ）
      if (data.winner_id && game.game_type === 'online') {
        if (!game.player2_id) {
          throw new BadRequestException('Online game must have player2_id to complete');
        }
        const loserId =
          data.winner_id === game.player1_id ? game.player2_id : game.player1_id;

        // 勝者: wins +1, score +25
        tx.update(users)
          .set({
            wins: sql`${users.wins} + 1`,
            user_score: sql`${users.user_score} + ${SCORE_PER_GAME}`,
          })
          .where(eq(users.uuid, data.winner_id))
          .run();

        // 敗者: losses +1, score -25 (最低0)
        if (loserId) {
          tx.update(users)
            .set({
              losses: sql`${users.losses} + 1`,
              user_score: sql`MAX(0, ${users.user_score} - ${SCORE_PER_GAME})`,
            })
            .where(eq(users.uuid, loserId))
            .run();
        }
      }

      return completed;
    });
  }

  /**
   * ユーザーの対戦履歴を取得（ページネーション付き）
   */
  getMatchHistory(userId: string, limit: number, offset: number) {
    const db = getDatabase();

    const player1 = alias(users, 'player1');
    const player2 = alias(users, 'player2');

    const rows = db
      .select({
        id: games.id,
        player1_id: games.player1_id,
        player2_id: games.player2_id,
        winner_id: games.winner_id,
        player1_score: games.player1_score,
        player2_score: games.player2_score,
        created_at: games.created_at,
        status: games.status,
        player1_display_name: player1.display_name,
        player2_display_name: player2.display_name,
      })
      .from(games)
      .leftJoin(player1, eq(games.player1_id, player1.uuid))
      .leftJoin(player2, eq(games.player2_id, player2.uuid))
      .where(or(eq(games.player1_id, userId), eq(games.player2_id, userId)))
      .orderBy(desc(games.created_at))
      .limit(limit)
      .offset(offset)
      .all();

    const total = db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(or(eq(games.player1_id, userId), eq(games.player2_id, userId)))
      .get();

    return {
      games: rows,
      total: total?.count ?? 0,
      limit,
      offset,
    };
  }

  /**
   * ゲームのステータスを更新（playing開始）
   * waiting → playing のみ許可
   */
  startGame(gameId: string): Game {
    const db = getDatabase();

    return db.transaction((tx) => {
      const game = tx.select().from(games).where(eq(games.id, gameId)).get();
      if (!game) {
        throw new NotFoundException('Game not found');
      }
      if (game.status !== 'waiting') {
        throw new BadRequestException(`Cannot start game in '${game.status}' status`);
      }
      return tx
        .update(games)
        .set({
          status: 'playing',
          started_at: new Date().toISOString(),
        })
        .where(eq(games.id, gameId))
        .returning()
        .get();
    });
  }
}
