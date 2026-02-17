import { Injectable } from '@nestjs/common';
import { z } from 'zod';

const CHAT_MAX_LENGTH = 200;
const CHAT_RATE_LIMIT = 5;
const CHAT_RATE_WINDOW_MS = 10_000;

export const chatMessageSchema = z.object({
  type: z.literal('chat_message'),
  content: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, { message: 'Message cannot be empty' }).max(CHAT_MAX_LENGTH)),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

type ValidateResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

@Injectable()
export class ChatService {
  private readonly rateLimitMap = new Map<string, number[]>();

  validate(userId: string, raw: unknown): ValidateResult {
    const parsed = chatMessageSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid message' };
    }

    const content = parsed.data.content;

    if (this.isRateLimited(userId)) {
      return { ok: false, error: 'Rate limited. Please wait before sending more messages.' };
    }

    this.recordMessage(userId);
    return { ok: true, content };
  }

  clearUser(userId: string): void {
    this.rateLimitMap.delete(userId);
  }

  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(userId);
    if (!timestamps) return false;

    const recent = timestamps.filter((t) => now - t < CHAT_RATE_WINDOW_MS);
    if (recent.length === 0) {
      this.rateLimitMap.delete(userId);
      return false;
    }
    this.rateLimitMap.set(userId, recent);

    return recent.length >= CHAT_RATE_LIMIT;
  }

  private recordMessage(userId: string): void {
    const timestamps = this.rateLimitMap.get(userId) ?? [];
    timestamps.push(Date.now());
    this.rateLimitMap.set(userId, timestamps);
  }
}
