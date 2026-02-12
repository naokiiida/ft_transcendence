import { z } from 'zod';
import { users } from '../db/schema';

// ═══════════════════════════════════════════════════════════
// 型定義 — Drizzle スキーマから導出（単一真実源）
// ═══════════════════════════════════════════════════════════

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PublicUser = Omit<User, 'password_hash'>;

// ═══════════════════════════════════════════════════════════
// フィールドカテゴリ
//
//  不変（作成時に固定）:
//    uuid, email, method, intra_id, intra_username, created_at
//
//  ユーザー変更可能:
//    display_name, avatar_url
//
//  システム変更可能:
//    password_hash, wins, losses, user_score, last_seen
//
// ═══════════════════════════════════════════════════════════

// ─── ドメインスキーマ（サービス層）──────────────────────

// --- 作成: method に応じた discriminated union ---

const createEmailUserSchema = z.object({
  method: z.literal('email'),
  email: z.string().email(),
  password_hash: z.string().min(1),
  display_name: z.string().min(1),
});

const createIntraUserSchema = z.object({
  method: z.literal('intra'),
  email: z.string().email(),
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

// --- 更新: ユーザー操作 ---

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).trim().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// --- 更新: システム操作 ---

export const gameResultSchema = z.object({
  result: z.enum(['win', 'loss']),
  score_delta: z.number().int().nonnegative(),
});
export type GameResult = z.infer<typeof gameResultSchema>;

// ─── HTTPスキーマ（コントローラー層）────────────────────

export const registerRequestSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }).trim().toLowerCase(),
  password: z.string().min(8, { message: 'Password too short' }),
  display_name: z
    .string()
    .min(1, { message: 'Display name is required' })
    .trim(),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }).trim().toLowerCase(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const searchUsersQuerySchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, { message: 'Display name is required' })
    .max(32, { message: 'Display name is too long' }),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;

export type LoginRequest = z.infer<typeof loginRequestSchema>;
