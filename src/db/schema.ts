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
import { LEAGUE_VISIBILITIES } from "../features/leagues/leagues.types";
import {
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../features/leagueTypes/leagueTypes.types";
import { DATA_SOURCE_NAMES } from "../features/dataSources/dataSources.types";
import {
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
} from "../features/leagueInvites/leagueInvites.types";
import { LEAGUE_MEMBER_ROLES } from "../features/leagueMembers/leagueMembers.types";
import { PHASE_TEMPLATE_TYPES } from "../features/phaseTemplates/phaseTemplates.types";

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

export const profilesTable = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, {
      onDelete: "cascade",
    }),
  username: text("username").notNull(), // is technically unique, with the exception of the anonymous user for deleted accounts
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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

export const sportsLeaguesTable = pgTable("sports_leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
    enum: [PHASE_TEMPLATE_TYPES.WEEK],
  }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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

export const teamsTable = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  sportLeagueId: uuid("sport_league_id")
    .references(() => sportsLeaguesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  name: text("name").notNull(), // "Jets"
  location: text("location").notNull(), // "New York"
  abbreviation: text("abbreviation").notNull(), // "NYJ"
  imageLight: text("image_light"),
  imageDark: text("image_dark"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const externalTeamsTable = pgTable(
  "external_teams",
  {
    dataSourceId: uuid("data_source_id")
      .references(() => dataSourcesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    externalId: text("external_id").notNull(),
    teamId: uuid("team_id")
      .references(() => teamsTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.externalId, table.dataSourceId] })],
);

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
  startPhaseTemplateId: uuid("start_phase_template_id")
    .references(() => phaseTemplatesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  endPhaseTemplateId: uuid("end_phase_template_id")
    .references(() => phaseTemplatesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
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

export const leagueInvitesTable = pgTable("league_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  leagueId: uuid("league_id")
    .references(() => leaguesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  inviterId: text("inviter_id")
    .references(() => usersTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  type: text("type", {
    enum: [LEAGUE_INVITE_TYPES.DIRECT, LEAGUE_INVITE_TYPES.LINK],
  }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  role: text("role", {
    enum: [LEAGUE_MEMBER_ROLES.COMMISSIONER, LEAGUE_MEMBER_ROLES.MEMBER],
  }).notNull(), // todo maybe in the future roles aren't a static enum, but a table with permissions, but for now this is fine
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  // Nullable fields that are used depending on invite type

  // Direct invite
  inviteeId: text("invitee_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  status: text("status", {
    enum: [
      LEAGUE_INVITE_STATUSES.PENDING,
      LEAGUE_INVITE_STATUSES.ACCEPTED,
      LEAGUE_INVITE_STATUSES.DECLINED,
    ],
  }),

  // Link invites
  token: text("token").unique(),
});

// CREATE TABLE events (
//   id UUID PRIMARY KEY,
//   season_id UUID REFERENCES seasons(id),
//   phase_id UUID REFERENCES phases(id),
//   start_time TIMESTAMP,
//   type TEXT NOT NULL,          -- 'game', 'match', 'tournament'
//   home_team_id UUID REFERENCES teams(id),
//   away_team_id UUID REFERENCES teams(id),
//   participants JSONB DEFAULT '[]', -- fallback for individual or non-team sports
//   metadata JSONB DEFAULT '{}'
// );

// CREATE TABLE live_scores (
//   event_id UUID PRIMARY KEY REFERENCES events(id),
//   home_score INT,
//   away_score INT,
//   status TEXT NOT NULL,         -- 'not_started', 'in_progress', 'final'
//   quarter TEXT,
//   clock TEXT,
//   updated_at TIMESTAMP DEFAULT now()
// );

// CREATE TABLE outcomes (
//   event_id UUID PRIMARY KEY REFERENCES events(id),
//   result TEXT,                  -- 'home', 'away', 'tie'
//   home_score INT,
//   away_score INT,
// );

// CREATE TABLE sportsbooks (
//   id UUID PRIMARY KEY,
//   name TEXT NOT NULL,
//   slug TEXT UNIQUE NOT NULL,
//   is_default BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMP DEFAULT now()
// );

// CREATE TABLE odds (
//   id UUID PRIMARY KEY,
//   event_id UUID REFERENCES events(id),
//   sportsbook_id UUID REFERENCES sportsbooks(id),
//   spread_home NUMERIC,
//   spread_away NUMERIC,
//   moneyline_home INT,
//   moneyline_away INT,
//   total NUMERIC,
//   updated_at TIMESTAMP DEFAULT now(),
//   metadata JSONB DEFAULT '{}'
// );
