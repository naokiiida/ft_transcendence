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
  email: z.email(),
  password_hash: z.string().min(1),
  display_name: z.string().min(1),
});

const createIntraUserSchema = z.object({
  method: z.literal('intra'),
  email: z.email(),
  intra_id: z.string().min(1),
  intra_username: z.string().min(1),
  display_name: z.string().min(1),
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
export type PublicUser = Omit<User, 'password_hash'>;
