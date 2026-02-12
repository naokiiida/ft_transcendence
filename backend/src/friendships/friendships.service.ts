import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, or, sql } from 'drizzle-orm';
import { getDatabase } from '../db/database';
import { friendships, users } from '../db/schema';
import type { Friendship } from '../model/friendship.model';

@Injectable()
export class FriendshipsService {
  /**
   * フレンドリクエストを送信する
   *
   * エッジケース:
   *  - 自分自身 → BadRequest（DB CHECK でも防げるが早期エラーの方が親切）
   *  - 相手が存在しない → NotFound
   *  - 既にリクエスト済み or 既にフレンド → Conflict
   *  - 逆方向の pending リクエストが存在 → 自動 accept（相互承認）
   */
  sendRequest(requesterId: string, addresseeId: string): Friendship {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const db = getDatabase();

    return db.transaction((tx) => {
      // 相手が存在するか確認
      const addressee = tx.select().from(users).where(eq(users.uuid, addresseeId)).get();
      if (!addressee) {
        throw new NotFoundException('User not found');
      }

      // 既存のフレンドシップを双方向で検索
      const existing = tx
        .select()
        .from(friendships)
        .where(
          or(
            and(eq(friendships.requester_id, requesterId), eq(friendships.addressee_id, addresseeId)),
            and(eq(friendships.requester_id, addresseeId), eq(friendships.addressee_id, requesterId)),
          ),
        )
        .get();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new ConflictException('Already friends');
        }

        if (existing.status === 'pending') {
          if (existing.requester_id === requesterId) {
            throw new ConflictException('Friend request already sent');
          }
          // 逆方向の pending → 相互承認なので自動 accept
          return tx
            .update(friendships)
            .set({ status: 'accepted', updated_at: new Date().toISOString() })
            .where(eq(friendships.id, existing.id))
            .returning()
            .get();
        }

        // declined → 既存レコードを UPDATE して再利用
        return tx
          .update(friendships)
          .set({
            requester_id: requesterId,
            addressee_id: addresseeId,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .where(eq(friendships.id, existing.id))
          .returning()
          .get();
      }

      return tx
        .insert(friendships)
        .values({
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: 'pending',
        })
        .returning()
        .get();
    });
  }

  /**
   * フレンドリクエストに応答する（accept / decline）
   * addressee のみが応答可能
   */
  respondToRequest(
    friendshipId: string,
    userId: string,
    response: 'accepted' | 'declined',
  ): Friendship {
    const db = getDatabase();

    return db.transaction((tx) => {
      const request = tx.select().from(friendships).where(eq(friendships.id, friendshipId)).get();
      if (!request) {
        throw new NotFoundException('Friend request not found');
      }
      if (request.addressee_id !== userId) {
        throw new ForbiddenException('Only the addressee can respond to this request');
      }
      if (request.status !== 'pending') {
        throw new ConflictException('This request has already been responded to');
      }

      return tx
        .update(friendships)
        .set({
          status: response,
          updated_at: new Date().toISOString(),
        })
        .where(eq(friendships.id, friendshipId))
        .returning()
        .get();
    });
  }

  /**
   * 受信した保留中リクエスト一覧（リクエスト送信者の情報付き）
   */
  getPendingRequests(userId: string) {
    const db = getDatabase();
    return db
      .select({
        id: friendships.id,
        requester_id: friendships.requester_id,
        display_name: users.display_name,
        avatar_url: users.avatar_url,
        created_at: friendships.created_at,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.requester_id, users.uuid))
      .where(
        and(
          eq(friendships.addressee_id, userId),
          eq(friendships.status, 'pending'),
        ),
      )
      .all();
  }

  /**
   * 送信した保留中リクエスト一覧（相手の情報付き）
   */
  getSentPendingRequests(userId: string) {
    const db = getDatabase();
    return db
      .select({
        id: friendships.id,
        addressee_id: friendships.addressee_id,
        display_name: users.display_name,
        avatar_url: users.avatar_url,
        created_at: friendships.created_at,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.addressee_id, users.uuid))
      .where(
        and(
          eq(friendships.requester_id, userId),
          eq(friendships.status, 'pending'),
        ),
      )
      .all();
  }

  /**
   * フレンド一覧（相手のプロフィール情報付き）
   */
  getFriends(userId: string) {
    const db = getDatabase();
    return db
      .select({
        friendship_id: friendships.id,
        friend_id: sql<string>`
          CASE
            WHEN ${friendships.requester_id} = ${userId} THEN ${friendships.addressee_id}
            ELSE ${friendships.requester_id}
          END
        `,
        display_name: users.display_name,
        avatar_url: users.avatar_url,
        user_score: users.user_score,
        last_seen: users.last_seen,
      })
      .from(friendships)
      .innerJoin(
        users,
        sql`${users.uuid} = CASE
          WHEN ${friendships.requester_id} = ${userId} THEN ${friendships.addressee_id}
          ELSE ${friendships.requester_id}
        END`,
      )
      .where(
        and(
          or(
            eq(friendships.requester_id, userId),
            eq(friendships.addressee_id, userId),
          ),
          eq(friendships.status, 'accepted'),
        ),
      )
      .all();
  }

  /**
   * フレンド解除 — 当事者のどちらでも削除可能
   */
  removeFriend(friendshipId: string, userId: string): { success: true } {
    const db = getDatabase();

    db.transaction((tx) => {
      const friendship = tx.select().from(friendships).where(eq(friendships.id, friendshipId)).get();
      if (!friendship) {
        throw new NotFoundException('Friendship not found');
      }
      if (friendship.requester_id !== userId && friendship.addressee_id !== userId) {
        throw new ForbiddenException('You are not part of this friendship');
      }
      tx.delete(friendships).where(eq(friendships.id, friendshipId)).run();
    });

    return { success: true };
  }

  findById(friendshipId: string): Friendship | null {
    const db = getDatabase();
    return db.select().from(friendships).where(eq(friendships.id, friendshipId)).get() ?? null;
  }
}
