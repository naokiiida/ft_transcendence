import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    uuid: text('uuid').primaryKey(),
    email: text('email').unique().notNull(),
    password_hash: text('password_hash'),
    display_name: text('display_name').unique().notNull(),
    avatar_url: text('avatar_url'),
    intra_id: text('intra_id').unique(),
    intra_username: text('intra_username').unique(),
    oauth_access_token: text('oauth_access_token'),
    oauth_refresh_token: text('oauth_refresh_token'),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    user_score: integer('user_score').notNull().default(1000),
    created_at: text('created_at').notNull(),
    last_seen: text('last_seen').notNull(),
    method: text('method', { enum: ['email', 'intra'] }).notNull().default('email'),
  },
  (table) => [
    index('idx_user_email').on(table.email),
    index('idx_user_intra_id').on(table.intra_id),
    index('idx_user_score').on(table.user_score),
  ],
);
