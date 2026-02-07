import { z } from 'zod';
import { users } from '../db/schema';

/**
 * User エンティティ — Drizzle スキーマから導出
 * フィールド名はフロントエンドに統一: id→uuid, elo_rating→user_score
 */
export type User = typeof users.$inferSelect;

/**
 * INSERT 用の型 — Drizzle スキーマから導出
 */
export type NewUser = typeof users.$inferInsert;

/**
 * 旧 DB トリガー (check_auth_consistency) の代替: Zod discriminated union
 * method に応じて必須フィールドをバリデーション
 */
const createEmailUserSchema = z.object({
  method: z.literal('email'),
  email: z.string(),
  password_hash: z.string(),
  display_name: z.string(),
});

const createIntraUserSchema = z.object({
  method: z.literal('intra'),
  email: z.string(),
  intra_id: z.string(),
  intra_username: z.string(),
  display_name: z.string(),
});

export const createUserInputSchema = z.discriminatedUnion('method', [
  createEmailUserSchema,
  createIntraUserSchema,
]);

export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type CreateEmailUserInput = z.infer<typeof createEmailUserSchema>;
export type CreateIntraUserInput = z.infer<typeof createIntraUserSchema>;

/**
 * 公開プロフィール（パスワードやトークンを除外）
 */
export type PublicUser = Omit<
  User,
  'password_hash' | 'oauth_access_token' | 'oauth_refresh_token'
>;
