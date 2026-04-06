import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const serverSessions = pgTable('server_sessions', {
  id: serial('id').primaryKey(),
  serverName: varchar('server_name', { length: 50 }).notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

export const usersRelations = relations(users, ({ many }) => ({
  serverSessions: many(serverSessions),
}));

export const serverSessionsRelations = relations(serverSessions, ({ one }) => ({
  user: one(users, { fields: [serverSessions.userId], references: [users.id] }),
}));
