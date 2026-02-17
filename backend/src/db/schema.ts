import { sqliteTable, text, integer, index, check, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// USERS
// ============================================================================

export const users = sqliteTable(
  'users',
  {
    uuid: text('uuid').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').unique().notNull(),
    password_hash: text('password_hash'),
    display_name: text('display_name').unique().notNull(),
    avatar_url: text('avatar_url'),
    intra_id: text('intra_id').unique(),
    intra_username: text('intra_username').unique(),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    user_score: integer('user_score').notNull().default(0),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    last_seen: text('last_seen').notNull().$defaultFn(() => new Date().toISOString()),
    method: text('method', { enum: ['email', 'intra'] }).notNull().default('email'),
  },
  (table) => [
    index('idx_user_score').on(table.user_score),
    check('chk_email_auth', sql`${table.method} != 'email' OR ${table.password_hash} IS NOT NULL`),
    check('chk_intra_auth', sql`${table.method} != 'intra' OR (${table.intra_id} IS NOT NULL AND ${table.intra_username} IS NOT NULL)`),
  ],
);

// ============================================================================
// SESSIONS — P0: replaces in-memory Map, survives server restarts
// ============================================================================

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id').notNull().references(() => users.uuid, { onDelete: 'cascade' }),
    expires_at: text('expires_at').notNull(),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index('idx_session_user').on(table.user_id),
    index('idx_session_expires').on(table.expires_at),
  ],
);

// ============================================================================
// GAMES — P1: match history + source of truth for wins/losses
// ============================================================================

export const games = sqliteTable(
  'games',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    player1_id: text('player1_id').notNull().references(() => users.uuid),
    player2_id: text('player2_id').references(() => users.uuid),
    winner_id: text('winner_id').references(() => users.uuid),
    player1_score: integer('player1_score').notNull().default(0),
    player2_score: integer('player2_score').notNull().default(0),
    game_type: text('game_type', { enum: ['local', 'online', 'ai'] }).notNull(),
    ai_difficulty: text('ai_difficulty', { enum: ['easy', 'medium', 'hard', 'EuropeanHard'] }),
    status: text('status', { enum: ['waiting', 'playing', 'completed', 'forfeit'] }).notNull(),
    score_delta: integer('score_delta'),
    started_at: text('started_at'),
    ended_at: text('ended_at'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index('idx_game_player1').on(table.player1_id),
    index('idx_game_player2').on(table.player2_id),
    index('idx_game_status').on(table.status),
    index('idx_game_created').on(table.created_at),
  ],
);

// ============================================================================
// FRIENDSHIPS — P2
// ============================================================================

export const friendships = sqliteTable(
  'friendships',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    requester_id: text('requester_id').notNull().references(() => users.uuid, { onDelete: 'cascade' }),
    addressee_id: text('addressee_id').notNull().references(() => users.uuid, { onDelete: 'cascade' }),
    status: text('status', { enum: ['pending', 'accepted', 'declined'] }).notNull(),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index('idx_friendship_requester').on(table.requester_id),
    index('idx_friendship_addressee').on(table.addressee_id),
    unique('uq_friendship_pair').on(table.requester_id, table.addressee_id),
    check('chk_no_self_friend', sql`${table.requester_id} != ${table.addressee_id}`),
  ],
);
