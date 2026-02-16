import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface MatchmakingStatus {
  in_queue: boolean;
  players_in_queue: number;
  queued_at: number | null;
  matched: boolean;
  matched_at: number | null;
  match_id: string | null;
  side: 'left' | 'right' | null;
}

@Injectable()
export class MatchmakingService {
  readonly events = new EventEmitter();
  private readonly queue = new Map<string, number>();
  private readonly assignments = new Map<
    string,
    {
      matchId: string;
      side: 'left' | 'right';
      opponentId: string;
      matchedAt: number;
    }
  >();

  join(userId: string): MatchmakingStatus {
    if (this.assignments.has(userId)) return this.status(userId);
    if (!this.queue.has(userId)) this.queue.set(userId, Date.now());
    this.tryMatch();
    return this.status(userId);
  }

  leave(userId: string): MatchmakingStatus {
    this.queue.delete(userId);
    const assignment = this.assignments.get(userId);
    if (assignment) {
      this.assignments.delete(userId);
      this.assignments.delete(assignment.opponentId);
      if (!this.queue.has(assignment.opponentId)) {
        this.queue.set(assignment.opponentId, Date.now());
      }
      this.events.emit('match_dissolved', {
        opponentId: assignment.opponentId,
        matchId: assignment.matchId,
        reason: 'opponent_left',
      });
    }
    return this.status(userId);
  }

  status(userId: string): MatchmakingStatus {
    const queuedAt = this.queue.get(userId) ?? null;
    const assignment = this.assignments.get(userId) ?? null;
    return {
      in_queue: queuedAt !== null,
      players_in_queue: this.queue.size,
      queued_at: queuedAt,
      matched: assignment !== null,
      matched_at: assignment?.matchedAt ?? null,
      match_id: assignment?.matchId ?? null,
      side: assignment?.side ?? null,
    };
  }

  getAssignment(userId: string) {
    return this.assignments.get(userId) ?? null;
  }

  clearAssignmentByMatchId(matchId: string) {
    for (const [userId, assignment] of this.assignments.entries()) {
      if (assignment.matchId !== matchId) continue;
      this.assignments.delete(userId);
      this.assignments.delete(assignment.opponentId);
      break;
    }
  }

  private tryMatch() {
    while (this.queue.size >= 2) {
      const [leftId, rightId] = Array.from(this.queue.keys()).slice(0, 2);
      if (!leftId || !rightId) return;
      this.queue.delete(leftId);
      this.queue.delete(rightId);
      const matchId = randomUUID();
      const matchedAt = Date.now();
      this.assignments.set(leftId, {
        matchId,
        side: 'left',
        opponentId: rightId,
        matchedAt,
      });
      this.assignments.set(rightId, {
        matchId,
        side: 'right',
        opponentId: leftId,
        matchedAt,
      });
    }
  }
}
