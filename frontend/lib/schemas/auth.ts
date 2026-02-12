import { z } from 'zod';

export const registerRequestSchema = z.object({
  email: z.email({ error: 'メールアドレスが無効です' }).trim().toLowerCase(),
  password: z.string().min(8, { error: 'パスワードは8文字以上必要です' }),
  display_name: z
    .string()
    .min(1, { error: '表示名を入力してください' })
    .trim(),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.email({ error: 'メールアドレスが無効です' }).trim().toLowerCase(),
  password: z.string().min(1, { error: 'パスワードを入力してください' }),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
