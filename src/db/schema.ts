import {
  pgTable,
  text,
  timestamp,
  boolean,
  primaryKey,
  uuid,
  jsonb,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { LEAGUE_VISIBILITIES } from "../features/leagues/leagues.types.js";
import {
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../features/leagueTypes/leagueTypes.types.js";
import { DATA_SOURCE_NAMES } from "../features/dataSources/dataSources.types.js";
import {
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
} from "../features/leagueInvites/leagueInvites.types.js";
import { LEAGUE_MEMBER_ROLES } from "../features/leagueMembers/leagueMembers.types.js";
import { PHASE_TEMPLATE_TYPES } from "../features/phaseTemplates/phaseTemplates.types.js";
import {
  EVENT_TYPES,
  LIVE_SCORE_STATUSES,
} from "../features/events/events.types.js";
import { PICK_RESULTS } from "../features/picks/picks.types.js";

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
    metadata: jsonb("metadata").notNull().default({}),
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
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
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
    metadata: jsonb("metadata").notNull().default({}),
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
  pickLockTime: timestamp("pick_lock_time").notNull(),
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
    metadata: jsonb("metadata").notNull().default({}),
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
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.externalId, table.dataSourceId] })],
);

export const eventsTable = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  phaseId: uuid("phase_id")
    .references(() => phasesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  startTime: timestamp("start_time").notNull(),
  type: text("type", {
    enum: [EVENT_TYPES.GAME],
  }).notNull(),
  // as far as I know in the future, all events will be head to head (football games and maybe march madness), so these can be non-nullable at least for now
  homeTeamId: uuid("home_team_id")
    .references(() => teamsTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  awayTeamId: uuid("away_team_id")
    .references(() => teamsTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const externalEventsTable = pgTable(
  "external_events",
  {
    eventId: uuid("event_id")
      .references(() => eventsTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    dataSourceId: uuid("data_source_id")
      .references(() => dataSourcesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    externalId: text("external_id").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.dataSourceId] })],
);

export const liveScoresTable = pgTable("live_scores", {
  eventId: uuid("event_id")
    .references(() => eventsTable.id, {
      onDelete: "cascade",
    })
    .notNull()
    .primaryKey(),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  status: text("status", {
    enum: [
      LIVE_SCORE_STATUSES.NOT_STARTED,
      LIVE_SCORE_STATUSES.IN_PROGRESS,
      LIVE_SCORE_STATUSES.FINAL,
    ],
  }).notNull(),
  period: integer("period").notNull(),
  clock: text("clock").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const outcomesTable = pgTable("outcomes", {
  eventId: uuid("event_id")
    .references(() => eventsTable.id, {
      onDelete: "cascade",
    })
    .notNull()
    .primaryKey(),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const sportsbooksTable = pgTable("sportsbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const externalSportsbooksTable = pgTable(
  "external_sportsbooks",
  {
    dataSourceId: uuid("data_source_id")
      .references(() => dataSourcesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    externalId: text("external_id").notNull(),
    sportsbookId: uuid("sportsbook_id")
      .references(() => sportsbooksTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.externalId, table.dataSourceId] })],
);

export const oddsTable = pgTable("odds", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .references(() => eventsTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  sportsbookId: uuid("sportsbook_id")
    .references(() => sportsbooksTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  spreadHome: decimal("spread_home", { precision: 10, scale: 2 }),
  spreadAway: decimal("spread_away", { precision: 10, scale: 2 }),
  moneylineHome: integer("moneyline_home"),
  moneylineAway: integer("moneyline_away"),
  total: decimal("total", { precision: 10, scale: 2 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const externalOddsTable = pgTable(
  "external_odds",
  {
    dataSourceId: uuid("data_source_id")
      .references(() => dataSourcesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    externalId: text("external_id").notNull(),
    oddsId: uuid("odds_id")
      .references(() => oddsTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    metadata: jsonb("metadata").notNull().default({}),
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

export const picksTable = pgTable("picks", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  eventId: uuid("event_id")
    .references(() => eventsTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  seasonId: uuid("season_id")
    .references(() => seasonsTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  // this can be non-nullable as long as the picks are only related to teams
  teamId: uuid("team_id")
    .references(() => teamsTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  // optional, because picks could be ats, but could just be straight up
  spread: decimal("spread", { precision: 10, scale: 2 }),
  result: text("result", {
    enum: [PICK_RESULTS.WIN, PICK_RESULTS.LOSS, PICK_RESULTS.PUSH],
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const standingsTable = pgTable(
  "standings",
  {
    userId: text("user_id")
      .references(() => usersTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    leagueId: uuid("league_id")
      .references(() => leaguesTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    seasonId: uuid("season_id")
      .references(() => seasonsTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    points: integer("points").notNull(),
    metadata: jsonb("metadata").notNull().default({}), // wins, losses, pushes, other league type specific stats
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.leagueId, table.seasonId] }),
  ],
);
