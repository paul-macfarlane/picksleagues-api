import { pgTable, text, timestamp, boolean, primaryKey, uuid, jsonb } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DBUser = typeof usersTable.$inferSelect;
export type DBUserInsert = typeof usersTable.$inferInsert;
export type DBUserUpdate = Partial<DBUserInsert>;

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DBSession = typeof sessionsTable.$inferSelect;
export type DBSessionInsert = typeof sessionsTable.$inferInsert;
export type DBSessionUpdate = Partial<DBSessionInsert>;

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DBAccount = typeof accountsTable.$inferSelect;
export type DBAccountInsert = typeof accountsTable.$inferInsert;
export type DBAccountUpdate = Partial<DBAccountInsert>;

export const verificationTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DBVerification = typeof verificationTable.$inferSelect;
export type DBVerificationInsert = typeof verificationTable.$inferInsert;
export type DBVerificationUpdate = Partial<DBVerificationInsert>;

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  username: text("username").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DBProfile = typeof profilesTable.$inferSelect;
export type DBProfileInsert = typeof profilesTable.$inferInsert;
export type DBProfileUpdate = Partial<DBProfileInsert>;

//------- Sports Data -------

export const dataSourcesTable = pgTable("data_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DBDataSource = typeof dataSourcesTable.$inferSelect;
export type DBDataSourceInsert = typeof dataSourcesTable.$inferInsert;
export type DBDataSourceUpdate = Partial<DBDataSourceInsert>;

export const sportsLeaguesTable = pgTable("sports_leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DBSportLeague = typeof sportsLeaguesTable.$inferSelect;
export type DBSportLeagueInsert = typeof sportsLeaguesTable.$inferInsert;
export type DBSportLeagueUpdate = Partial<DBSportLeagueInsert>;

export const externalSportLeaguesTable = pgTable("external_sport_leagues", {
  dataSourceId: uuid("data_source_id").references(() => dataSourcesTable.id, {
    onDelete: "cascade",
  }).notNull(),
  externalId: text("external_id").notNull(),
  sportLeagueId: uuid("sport_league_id").references(() => sportsLeaguesTable.id, {
    onDelete: "cascade",
  }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  primaryKey({ columns: [table.externalId, table.dataSourceId] }),
]);

export type DBExternalSportLeague = typeof externalSportLeaguesTable.$inferSelect;
export type DBExternalSportLeagueInsert = typeof externalSportLeaguesTable.$inferInsert;
export type DBExternalSportLeagueUpdate = Partial<DBExternalSportLeagueInsert>;
