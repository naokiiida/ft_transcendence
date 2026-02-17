export type MatchRow = {
  id: string;
  player1_id: string;
  player2_id: string | null;
  winner_id: string | null;
  player1_score: number;
  player2_score: number;
  created_at: string;
  status: string;
  player1_display_name?: string | null;
  player2_display_name?: string | null;
};

export type MatchHistoryResponse = {
  games: MatchRow[];
  total: number;
  limit: number;
  offset: number;
};

export type AchievementRow = {
  id: string;
  title: string;
  description: string;
  progress: number;
  unlocked: boolean;
};

export type LeaderboardEntry = {
  uuid: string;
  display_name: string;
  avatar_url: string | null;
  user_score: number;
  position: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
};

export type FriendEntry = {
  friendship_id: string;
  friend_id: string;
  display_name: string;
  avatar_url: string | null;
  user_score: number;
  last_seen: string;
};

export type PendingRequestEntry = {
  id: string;
  requester_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type SentRequestEntry = {
  id: string;
  addressee_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type SearchUserEntry = {
  uuid: string;
  display_name: string;
  avatar_url: string | null;
};
