import {
  pgTable,
  text,
  timestamp,
  boolean,
  primaryKey,
  uuid,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import {
  LEAGUE_MEMBER_ROLES,
  LEAGUE_VISIBILITIES,
} from "../lib/models/leagues";
import {
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../lib/models/leagueTypes";
import { PHASE_TYPES } from "../lib/models/phases";
import { DATA_SOURCE_NAMES } from "../lib/models/dataSources";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBVerification = typeof verificationTable.$inferSelect;
export type DBVerificationInsert = typeof verificationTable.$inferInsert;
export type DBVerificationUpdate = Partial<DBVerificationInsert>;

export const profilesTable = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, {
      onDelete: "cascade",
    }),
  username: text("username").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBProfile = typeof profilesTable.$inferSelect;
export type DBProfileInsert = typeof profilesTable.$inferInsert;
export type DBProfileUpdate = Partial<DBProfileInsert>;

//------- Sports Data -------

export const dataSourcesTable = pgTable("data_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name", {
    enum: [DATA_SOURCE_NAMES.ESPN],
  })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBDataSource = typeof dataSourcesTable.$inferSelect;
export type DBDataSourceInsert = typeof dataSourcesTable.$inferInsert;
export type DBDataSourceUpdate = Partial<DBDataSourceInsert>;

export const sportsLeaguesTable = pgTable("sports_leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBSportLeague = typeof sportsLeaguesTable.$inferSelect;
export type DBSportLeagueInsert = typeof sportsLeaguesTable.$inferInsert;
export type DBSportLeagueUpdate = Partial<DBSportLeagueInsert>;

export const externalSportLeaguesTable = pgTable(
  "external_sport_leagues",
  {
    dataSourceId: uuid("data_source_id")
      .references(() => dataSourcesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    externalId: text("external_id").notNull(),
    sportLeagueId: uuid("sport_league_id")
      .references(() => sportsLeaguesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.externalId, table.dataSourceId] })],
);

export type DBExternalSportLeague =
  typeof externalSportLeaguesTable.$inferSelect;
export type DBExternalSportLeagueInsert =
  typeof externalSportLeaguesTable.$inferInsert;
export type DBExternalSportLeagueUpdate = Partial<DBExternalSportLeagueInsert>;

export const seasonsTable = pgTable("seasons", {
  id: uuid("id").primaryKey().defaultRandom(),
  sportLeagueId: uuid("sport_league_id")
    .references(() => sportsLeaguesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  name: text("name").notNull(),
  year: text("year").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
});

export type DBSeason = typeof seasonsTable.$inferSelect;
export type DBSeasonInsert = typeof seasonsTable.$inferInsert;
export type DBSeasonUpdate = Partial<DBSeasonInsert>;

export const externalSeasonsTable = pgTable(
  "external_seasons",
  {
    dataSourceId: uuid("data_source_id")
      .references(() => dataSourcesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    externalId: text("external_id").notNull(),
    seasonId: uuid("season_id")
      .references(() => seasonsTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.externalId, table.dataSourceId] })],
);

export type DBExternalSeason = typeof externalSeasonsTable.$inferSelect;
export type DBExternalSeasonInsert = typeof externalSeasonsTable.$inferInsert;
export type DBExternalSeasonUpdate = Partial<DBExternalSeasonInsert>;

export const phaseTemplatesTable = pgTable("phase_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  sportLeagueId: uuid("sport_league_id")
    .references(() => sportsLeaguesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  label: text("label").notNull(),
  sequence: integer("sequence").notNull(),
  type: text("type", {
    enum: [PHASE_TYPES.WEEK],
  }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBPhaseTemplate = typeof phaseTemplatesTable.$inferSelect;
export type DBPhaseTemplateInsert = typeof phaseTemplatesTable.$inferInsert;
export type DBPhaseTemplateUpdate = Partial<DBPhaseTemplateInsert>;

export const phasesTable = pgTable("phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  seasonId: uuid("season_id")
    .references(() => seasonsTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  phaseTemplateId: uuid("phase_template_id")
    .references(() => phaseTemplatesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  sequence: integer("sequence").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBPhase = typeof phasesTable.$inferSelect;
export type DBPhaseInsert = typeof phasesTable.$inferInsert;
export type DBPhaseUpdate = Partial<DBPhaseInsert>;

export const externalPhasesTable = pgTable(
  "external_phases",
  {
    dataSourceId: uuid("data_source_id")
      .references(() => dataSourcesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    externalId: text("external_id").notNull(),
    phaseId: uuid("phase_id")
      .references(() => phasesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.externalId, table.dataSourceId] })],
);

export type DBExternalPhase = typeof externalPhasesTable.$inferSelect;
export type DBExternalPhaseInsert = typeof externalPhasesTable.$inferInsert;
export type DBExternalPhaseUpdate = Partial<DBExternalPhaseInsert>;

// leagues

export const leaguesTable = pgTable("leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  image: text("image"),
  leagueTypeId: uuid("league_type_id")
    .references(() => leagueTypesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  startPhaseTemplateId: uuid("start_phase_template_id").references(
    () => phaseTemplatesTable.id,
    {
      onDelete: "cascade",
    },
  ),
  endPhaseTemplateId: uuid("end_phase_template_id").references(
    () => phaseTemplatesTable.id,
    {
      onDelete: "cascade",
    },
  ),
  visibility: text("visibility", {
    enum: [LEAGUE_VISIBILITIES.PRIVATE],
  }).notNull(),
  size: integer("size").notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBLeague = typeof leaguesTable.$inferSelect;
export type DBLeagueInsert = typeof leaguesTable.$inferInsert;
export type DBLeagueUpdate = Partial<DBLeagueInsert>;

export const leagueMembersTable = pgTable(
  "league_members",
  {
    leagueId: uuid("league_id")
      .references(() => leaguesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    userId: text("user_id")
      .references(() => usersTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    role: text("role", {
      enum: [LEAGUE_MEMBER_ROLES.COMMISSIONER, LEAGUE_MEMBER_ROLES.MEMBER],
    }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.leagueId, table.userId] })],
);

export type DBLeagueMember = typeof leagueMembersTable.$inferSelect;
export type DBLeagueMemberInsert = typeof leagueMembersTable.$inferInsert;
export type DBLeagueMemberUpdate = Partial<DBLeagueMemberInsert>;

export const leagueTypesTable = pgTable("league_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug", {
    enum: [LEAGUE_TYPE_SLUGS.PICK_EM],
  })
    .notNull()
    .unique(),
  name: text("name", {
    enum: [LEAGUE_TYPE_NAMES.PICK_EM],
  })
    .notNull()
    .unique(),
  description: text("description"),
  sportLeagueId: uuid("sport_league_id")
    .references(() => sportsLeaguesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBLeagueType = typeof leagueTypesTable.$inferSelect;
export type DBLeagueTypeInsert = typeof leagueTypesTable.$inferInsert;
export type DBLeagueTypeUpdate = Partial<DBLeagueTypeInsert>;
