import { z } from 'zod';

export const registerRequestSchema = z.object({
  email: z.string().email({ message: 'メールアドレスが無効です' }).trim().toLowerCase(),
  password: z.string().min(8, { message: 'パスワードは8文字以上必要です' }),
  display_name: z
    .string()
    .min(1, { message: '表示名を入力してください' })
    .trim(),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email({ message: 'メールアドレスが無効です' }).trim().toLowerCase(),
  password: z.string().min(1, { message: 'パスワードを入力してください' }),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
