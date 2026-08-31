import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const studentStates = sqliteTable("student_states", {
  userId: text("user_id").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tutorDailyUsage = sqliteTable("tutor_daily_usage", {
  userId: text("user_id").notNull(),
  day: text("day").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  lastRequestAt: integer("last_request_at").notNull().default(0),
  activeUntil: integer("active_until").notNull().default(0),
}, table => [primaryKey({ columns: [table.userId, table.day] })]);

export const tutorGlobalUsage = sqliteTable("tutor_global_usage", {
  period: text("period").primaryKey(),
  requestCount: integer("request_count").notNull().default(0),
});
