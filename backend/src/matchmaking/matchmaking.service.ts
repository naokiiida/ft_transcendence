import { Injectable } from '@nestjs/common';

export interface MatchmakingStatus {
  in_queue: boolean;
  players_in_queue: number;
  queued_at: number | null;
  matched: boolean;
  matched_at: number | null;
}

@Injectable()
export class MatchmakingService {
  private readonly queue = new Map<string, number>();
  private readonly matches = new Map<string, number>();

  join(userId: string): MatchmakingStatus {
    if (!this.queue.has(userId)) {
      this.queue.set(userId, Date.now());
    }
    return this.status(userId);
  }

  leave(userId: string): MatchmakingStatus {
    this.queue.delete(userId);
    this.matches.delete(userId);
    return this.status(userId);
  }

  status(userId: string): MatchmakingStatus {
    if (this.queue.size < 2) {
      this.matches.clear();
    } else {
      const now = Date.now();
      for (const id of this.queue.keys()) {
        if (!this.matches.has(id)) {
          this.matches.set(id, now);
        }
      }
    }
    const queuedAt = this.queue.get(userId) ?? null;
    const matchedAt = this.matches.get(userId) ?? null;
    return {
      in_queue: queuedAt !== null,
      players_in_queue: this.queue.size,
      queued_at: queuedAt,
      matched: matchedAt !== null,
      matched_at: matchedAt,
    };
  }
}
