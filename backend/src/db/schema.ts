import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

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
    user_score: integer('user_score').notNull().default(1000),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    last_seen: text('last_seen').notNull().$defaultFn(() => new Date().toISOString()),
    method: text('method', { enum: ['email', 'intra'] }).notNull().default('email'),
  },
  (table) => [index('idx_user_score').on(table.user_score)],
);
