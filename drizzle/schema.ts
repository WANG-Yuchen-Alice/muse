import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * A generation session — one user input → multiple generated tracks.
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  /** Optional user reference (null for anonymous) */
  userId: int("userId"),
  /** URL to the original uploaded audio (hum/piano recording) */
  originalAudioUrl: text("originalAudioUrl"),
  /** Text description of the melody extracted from the input */
  melodyDescription: text("melodyDescription"),
  /** Input mode: hum or piano */
  inputMode: varchar("inputMode", { length: 16 }),
  /** AI-generated session name (e.g. "Morning Whispers") */
  sessionName: varchar("sessionName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * A single generated track within a session.
 */
export const tracks = mysqlTable("tracks", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  /** Style: lofi, cinematic, jazz, electronic */
  styleId: varchar("styleId", { length: 32 }).notNull(),
  /** Variant: faithful (MusicGen) or reimagined (Lyria 3) */
  variant: varchar("variant", { length: 32 }).notNull(),
  /** AI-generated creative track name */
  trackName: varchar("trackName", { length: 200 }),
  /** URL to the generated audio file */
  audioUrl: text("audioUrl"),
  /** URL to the AI-generated background image */
  imageUrl: text("imageUrl"),
  /** Caption/description from the model */
  caption: text("caption"),
  /** Duration in seconds */
  duration: int("duration"),
  /** URL to the generated music video (9:16 vertical) */
  videoUrl: text("videoUrl"),
  /** Generation status */
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

/**
 * Pre-generated style background images library.
 * Reusable across tracks of the same style.
 */
export const styleImages = mysqlTable("styleImages", {
  id: int("id").autoincrement().primaryKey(),
  /** Style: lofi, cinematic, jazz, electronic */
  styleId: varchar("styleId", { length: 32 }).notNull(),
  /** CDN URL to the generated image */
  imageUrl: text("imageUrl").notNull(),
  /** The prompt used to generate this image */
  prompt: text("prompt"),
  /** Usage count — for round-robin or random selection */
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StyleImage = typeof styleImages.$inferSelect;
export type InsertStyleImage = typeof styleImages.$inferInsert;
