import { randomUUID } from "crypto";
import { eq, ne } from "drizzle-orm";
import {
  usersTable,
  profilesTable,
  leaguesTable,
  leagueMembersTable,
  leagueTypesTable,
  phaseTemplatesTable,
  phasesTable,
  eventsTable,
  teamsTable,
  liveScoresTable,
  outcomesTable,
  picksTable,
  seasonsTable,
  sportsLeaguesTable,
} from "../schema.js";
import { LEAGUE_MEMBER_ROLES } from "../../features/leagueMembers/leagueMembers.types.js";
import {
  LEAGUE_VISIBILITIES,
  PICK_EM_PICK_TYPES,
} from "../../features/leagues/leagues.types.js";
import {
  LIVE_SCORE_STATUSES,
  EVENT_TYPES,
} from "../../features/events/events.types.js";
import { DBTx } from "../index.js";

// Clean up existing pick'em data
async function cleanupPickemData(tx: DBTx, commissionerUserId?: string) {
  console.log("🧹 Cleaning up existing pick'em data...");

  // Delete in reverse order of dependencies to avoid foreign key constraint violations

  // Delete picks first (depends on users, events, teams, leagues)
  await tx.delete(picksTable);
  console.log("  ✅ Deleted picks");

  // Delete live scores and outcomes (depend on events)
  await tx.delete(liveScoresTable);
  await tx.delete(outcomesTable);
  console.log("  ✅ Deleted live scores and outcomes");

  // Delete events (depend on phases, teams)
  await tx.delete(eventsTable);
  console.log("  ✅ Deleted events");

  // Delete league members (depend on leagues, users)
  await tx.delete(leagueMembersTable);
  console.log("  ✅ Deleted league members");

  // Delete leagues (depend on league types, phase templates)
  await tx.delete(leaguesTable);
  console.log("  ✅ Deleted leagues");

  // Delete phases (depend on seasons, phase templates)
  await tx.delete(phasesTable);
  console.log("  ✅ Deleted phases");

  // Delete teams (depend on sport leagues)
  await tx.delete(teamsTable);
  console.log("  ✅ Deleted teams");

  // Delete users and profiles (but preserve commissioner if specified)
  if (commissionerUserId) {
    // Delete all users except the commissioner
    await tx.delete(usersTable).where(ne(usersTable.id, commissionerUserId));
    console.log(
      `  ✅ Deleted users (preserved commissioner: ${commissionerUserId})`,
    );
  } else {
    // Delete all users
    await tx.delete(usersTable);
    console.log("  ✅ Deleted all users");
  }

  // Delete profiles for deleted users (profiles will cascade or we can delete them explicitly)
  // Note: This might need adjustment based on your foreign key constraints

  console.log("🧹 Cleanup completed!");
}

export type SeedingPhase = "offseason" | "preseason" | "inSeason" | "endSeason";

export interface PickemSeedingConfig {
  phase: SeedingPhase;
  simulateWeek?: number; // Only for inSeason
  leagueCount: number;
  usersPerLeague: number;
  includeATS?: boolean; // Whether to include ATS leagues
  includeStraightUp?: boolean; // Whether to include straight up leagues
  commissionerUserId?: string; // Optional user ID to make commissioner of all leagues
  cleanup?: boolean; // Whether to clean up existing pick'em data before seeding
}

export interface SeededData {
  users: Array<{ id: string; name: string; email: string }>;
  teams: Array<{ id: string; name: string }>;
  phases: Array<{
    id: string;
    sequence: number;
    startDate: Date;
    endDate: Date;
  }>;
  leagues: Array<{ id: string; name: string; type: string }>;
  events: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    week: number;
    phaseId: string;
  }>;
}

// Generate fake team names
const generateTeams = () => {
  const teamNames = [
    { name: "Lions", location: "Detroit", abbreviation: "DET" },
    { name: "Bears", location: "Chicago", abbreviation: "CHI" },
    { name: "Eagles", location: "Philadelphia", abbreviation: "PHI" },
    { name: "Falcons", location: "Atlanta", abbreviation: "ATL" },
    { name: "Ravens", location: "Baltimore", abbreviation: "BAL" },
    { name: "Bills", location: "Buffalo", abbreviation: "BUF" },
    { name: "Panthers", location: "Carolina", abbreviation: "CAR" },
    { name: "Bengals", location: "Cincinnati", abbreviation: "CIN" },
    { name: "Browns", location: "Cleveland", abbreviation: "CLE" },
    { name: "Cowboys", location: "Dallas", abbreviation: "DAL" },
    { name: "Broncos", location: "Denver", abbreviation: "DEN" },
    { name: "Texans", location: "Houston", abbreviation: "HOU" },
  ];

  return teamNames.map((team, index) => ({
    id: randomUUID(),
    name: team.name,
    location: team.location,
    abbreviation: team.abbreviation,
    externalId: `team_${index + 1}`,
    dataSourceId: randomUUID(), // Will be set to actual data source
  }));
};

// Generate fake users
const generateUsers = (count: number, commissionerUserId?: string) => {
  const users = [];

  // If commissioner user ID is provided, we need one less generated user
  const usersToGenerate = commissionerUserId ? count - 1 : count;

  for (let i = 1; i <= usersToGenerate; i++) {
    const userId = randomUUID();
    users.push({
      id: userId,
      name: `Test User ${i}`,
      email: `user${i}@test.com`,
      emailVerified: true,
      profile: {
        userId,
        username: `user${i}`,
        firstName: `User`,
        lastName: `${i}`,
      },
    });
  }

  // If commissioner user ID is provided, add it to the users array
  if (commissionerUserId) {
    users.push({
      id: commissionerUserId,
      name: `Commissioner User`,
      email: `commissioner@test.com`,
      emailVerified: true,
      profile: {
        userId: commissionerUserId,
        username: `commissioner`,
        firstName: `Commissioner`,
        lastName: `User`,
      },
    });
  }

  return users;
};

// Generate game schedule (6 games per week, 10 weeks)
const generateGameSchedule = (teams: Array<{ id: string; name: string }>) => {
  const games = [];
  const teamIds = teams.map((t) => t.id);

  for (let week = 1; week <= 10; week++) {
    const weekGames = [];
    const usedTeams = new Set<string>();

    // Generate 6 games per week
    for (let game = 1; game <= 6; game++) {
      let homeTeamId: string;
      let awayTeamId: string;

      // Find two teams that haven't played this week
      do {
        homeTeamId = teamIds[Math.floor(Math.random() * teamIds.length)];
        awayTeamId = teamIds[Math.floor(Math.random() * teamIds.length)];
      } while (
        homeTeamId === awayTeamId ||
        usedTeams.has(homeTeamId) ||
        usedTeams.has(awayTeamId)
      );

      usedTeams.add(homeTeamId);
      usedTeams.add(awayTeamId);

      weekGames.push({
        week,
        game,
        homeTeamId,
        awayTeamId,
        homeTeamName: teams.find((t) => t.id === homeTeamId)?.name || "",
        awayTeamName: teams.find((t) => t.id === awayTeamId)?.name || "",
      });
    }

    games.push(...weekGames);
  }

  return games;
};

// Calculate game times based on phase
const calculateGameTimes = (phase: SeedingPhase, simulateWeek?: number) => {
  const now = new Date();
  const baseTime = new Date(now);

  switch (phase) {
    case "offseason":
      // Games happened 3-4 months ago
      baseTime.setMonth(baseTime.getMonth() - 4);
      break;
    case "preseason":
      // Games happen 1-2 weeks from now
      baseTime.setDate(baseTime.getDate() + 10);
      break;
    case "inSeason":
      // Current week games are this week, past weeks are in the past
      if (simulateWeek && simulateWeek > 1) {
        baseTime.setDate(baseTime.getDate() - (simulateWeek - 1) * 7);
      }
      break;
    case "endSeason":
      // Games happened 1-2 weeks ago
      baseTime.setDate(baseTime.getDate() - 10);
      break;
  }

  return baseTime;
};

// Generate game status and scores based on phase and week
const generateGameStatus = (
  phase: SeedingPhase,
  week: number,
  simulateWeek?: number,
) => {
  switch (phase) {
    case "offseason":
      return {
        status: LIVE_SCORE_STATUSES.FINAL,
        hasScores: true,
        homeScore: Math.floor(Math.random() * 40) + 10,
        awayScore: Math.floor(Math.random() * 40) + 10,
      };
    case "preseason":
      return {
        status: LIVE_SCORE_STATUSES.NOT_STARTED,
        hasScores: false,
        homeScore: 0,
        awayScore: 0,
      };
    case "inSeason":
      if (week < (simulateWeek || 1)) {
        return {
          status: LIVE_SCORE_STATUSES.FINAL,
          hasScores: true,
          homeScore: Math.floor(Math.random() * 40) + 10,
          awayScore: Math.floor(Math.random() * 40) + 10,
        };
      } else if (week === (simulateWeek || 1)) {
        // Some games might be in progress
        const isInProgress = Math.random() > 0.7;
        return {
          status: isInProgress
            ? LIVE_SCORE_STATUSES.IN_PROGRESS
            : LIVE_SCORE_STATUSES.NOT_STARTED,
          hasScores: isInProgress,
          homeScore: isInProgress ? Math.floor(Math.random() * 30) + 7 : 0,
          awayScore: isInProgress ? Math.floor(Math.random() * 30) + 7 : 0,
        };
      } else {
        return {
          status: LIVE_SCORE_STATUSES.NOT_STARTED,
          hasScores: false,
          homeScore: 0,
          awayScore: 0,
        };
      }
    case "endSeason":
      return {
        status: LIVE_SCORE_STATUSES.FINAL,
        hasScores: true,
        homeScore: Math.floor(Math.random() * 40) + 10,
        awayScore: Math.floor(Math.random() * 40) + 10,
      };
  }
};

// Generate picks based on phase and week
const generatePicks = (
  users: Array<{ id: string }>,
  events: Array<{ id: string; week: number }>,
  teams: Array<{ id: string }>,
  leagues: Array<{ id: string }>,
  phase: SeedingPhase,
  simulateWeek?: number,
) => {
  const picks = [];

  for (const user of users) {
    for (const event of events) {
      const shouldHavePick = (() => {
        switch (phase) {
          case "offseason":
            return true; // All picks made
          case "preseason":
            return false; // No picks made
          case "inSeason":
            return event.week <= (simulateWeek || 1); // Picks up to current week
          case "endSeason":
            return true; // All picks made
        }
      })();

      if (shouldHavePick) {
        // Randomly select a team and league from the actual generated ones
        const randomTeam = teams[Math.floor(Math.random() * teams.length)];
        const randomLeague =
          leagues[Math.floor(Math.random() * leagues.length)];

        picks.push({
          leagueId: randomLeague.id,
          userId: user.id,
          eventId: event.id,
          teamId: randomTeam.id,
          spread:
            Math.random() > 0.5
              ? (Math.floor(Math.random() * 14) - 7).toString()
              : null, // Random spread for ATS
        });
      }
    }
  }

  return picks;
};

export async function seedPickemLeagues(
  tx: DBTx,
  config: PickemSeedingConfig,
): Promise<SeededData> {
  console.log(`🌱 Seeding Pick'em leagues for phase: ${config.phase}`);

  // Clean up existing data if requested
  if (config.cleanup) {
    await cleanupPickemData(tx, config.commissionerUserId);
  }

  // Get required data from database
  const [leagueType] = await tx.select().from(leagueTypesTable).limit(1);
  const [sportLeague] = await tx.select().from(sportsLeaguesTable).limit(1);
  const [season] = await tx.select().from(seasonsTable).limit(1);
  const phaseTemplates = await tx
    .select()
    .from(phaseTemplatesTable)
    .orderBy(phaseTemplatesTable.sequence);

  if (!leagueType || !sportLeague || !season || phaseTemplates.length === 0) {
    throw new Error("Required base data not found. Run basic seeding first.");
  }

  if (phaseTemplates.length < 10) {
    throw new Error(
      `Expected 10 phase templates, found ${phaseTemplates.length}. Run basic seeding first.`,
    );
  }

  // Generate teams
  const teams = generateTeams();
  console.log(`📊 Generated ${teams.length} teams`);

  // Generate users
  const totalUsers = config.leagueCount * config.usersPerLeague;
  const users = generateUsers(totalUsers, config.commissionerUserId);
  console.log(`👥 Generated ${users.length} users`);
  if (config.commissionerUserId) {
    console.log(`👑 Commissioner user ID: ${config.commissionerUserId}`);
  }

  // Generate game schedule
  const gameSchedule = generateGameSchedule(teams);
  console.log(`🏈 Generated ${gameSchedule.length} games across 10 weeks`);

  // Calculate base game time
  const baseGameTime = calculateGameTimes(config.phase, config.simulateWeek);

  // Create phases for each week (10 weeks total)
  const phases: Array<{
    id: string;
    sequence: number;
    startDate: Date;
    endDate: Date;
    pickLockTime: Date;
    phaseTemplateId: string;
  }> = [];

  for (let week = 1; week <= 10; week++) {
    const weekStartDate = new Date(baseGameTime);
    weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // 7 days per week

    // Pick lock time is on the second-to-last day of the phase (day 5 of 7)
    const pickLockTime = new Date(weekStartDate);
    pickLockTime.setDate(pickLockTime.getDate() + 5); // Day 6 of the week (0-indexed)
    pickLockTime.setHours(12, 0, 0, 0); // Noon on that day

    // Find the phase template for this week
    const phaseTemplate = phaseTemplates.find((pt) => pt.sequence === week);
    if (!phaseTemplate) {
      throw new Error(`No phase template found for week ${week}`);
    }

    phases.push({
      id: randomUUID(),
      sequence: week,
      startDate: weekStartDate,
      endDate: weekEndDate,
      pickLockTime,
      phaseTemplateId: phaseTemplate.id,
    });
  }

  // Insert all phases
  await tx.insert(phasesTable).values(
    phases.map((phase) => ({
      id: phase.id,
      seasonId: season.id,
      phaseTemplateId: phase.phaseTemplateId,
      sequence: phase.sequence,
      startDate: phase.startDate,
      endDate: phase.endDate,
      pickLockTime: phase.pickLockTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  console.log(`📅 Created ${phases.length} phases (one per week)`);

  // Insert teams
  await tx.insert(teamsTable).values(
    teams.map((team) => ({
      id: team.id,
      name: team.name,
      sportLeagueId: sportLeague.id,
      location: team.location,
      abbreviation: team.abbreviation,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  // Insert users and profiles
  // Check if commissioner user already exists
  let usersToInsert = users;
  if (config.commissionerUserId) {
    try {
      const existingUser = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, config.commissionerUserId))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(
          `👤 Commissioner user ${config.commissionerUserId} already exists, skipping insertion`,
        );
        // Remove commissioner from users to insert
        usersToInsert = users.filter(
          (user) => user.id !== config.commissionerUserId,
        );
      }
    } catch {
      console.log(
        `👤 Commissioner user ${config.commissionerUserId} not found, will insert`,
      );
    }
  }

  if (usersToInsert.length > 0) {
    await tx.insert(usersTable).values(
      usersToInsert.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );

    await tx.insert(profilesTable).values(
      usersToInsert.map((user) => ({
        userId: user.id,
        username: user.profile.username,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }

  // Generate and insert events
  const events: Array<{
    id: string;
    phaseId: string;
    startTime: Date;
    type: typeof EVENT_TYPES.GAME;
    homeTeamId: string;
    awayTeamId: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (let i = 0; i < gameSchedule.length; i++) {
    const game = gameSchedule[i];

    // Find the phase for this week
    const phase = phases.find((p) => p.sequence === game.week);
    if (!phase) {
      throw new Error(`No phase found for week ${game.week}`);
    }

    // All events in a phase happen on the same day (last day of the phase)
    const eventDate = new Date(phase.endDate);
    eventDate.setDate(eventDate.getDate() - 1); // Second-to-last day of the phase
    eventDate.setHours(12 + game.game, 0, 0, 0); // Games start at 12 PM, 1 PM, 2 PM, etc.

    const eventId = randomUUID();

    events.push({
      id: eventId,
      phaseId: phase.id,
      startTime: eventDate,
      type: EVENT_TYPES.GAME,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Insert all events first
  await tx.insert(eventsTable).values(events);

  // Then insert live scores and outcomes
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const game = gameSchedule[i];
    const gameStatus = generateGameStatus(
      config.phase,
      game.week,
      config.simulateWeek,
    );

    // Insert live scores/outcomes
    if (gameStatus.hasScores) {
      await tx.insert(outcomesTable).values({
        eventId: event.id,
        homeScore: gameStatus.homeScore,
        awayScore: gameStatus.awayScore,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await tx.insert(liveScoresTable).values({
      eventId: event.id,
      homeScore: gameStatus.homeScore,
      awayScore: gameStatus.awayScore,
      status: gameStatus.status,
      period: gameStatus.status === LIVE_SCORE_STATUSES.FINAL ? 4 : 1,
      clock:
        gameStatus.status === LIVE_SCORE_STATUSES.FINAL ? "00:00" : "15:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Generate leagues
  const leagues: Array<{
    id: string;
    name: string;
    image: string | null;
    leagueTypeId: string;
    startPhaseTemplateId: string;
    endPhaseTemplateId: string;
    visibility: typeof LEAGUE_VISIBILITIES.PRIVATE;
    size: number;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  for (let i = 0; i < config.leagueCount; i++) {
    const leagueId = randomUUID();
    const isATS = (config.includeATS ?? true) && i % 2 === 0;

    // Get first and last phase templates for league start/end
    const firstPhaseTemplate = phaseTemplates[0]; // Week 1
    const lastPhaseTemplate = phaseTemplates[phaseTemplates.length - 1]; // Week 10

    leagues.push({
      id: leagueId,
      name: `${config.phase} League ${i + 1} (${isATS ? "ATS" : "Straight Up"})`,
      image: null,
      leagueTypeId: leagueType.id,
      startPhaseTemplateId: firstPhaseTemplate.id,
      endPhaseTemplateId: lastPhaseTemplate.id,
      visibility: LEAGUE_VISIBILITIES.PRIVATE,
      size: config.usersPerLeague,
      settings: {
        picksPerPhase: 3,
        pickType: isATS
          ? PICK_EM_PICK_TYPES.SPREAD
          : PICK_EM_PICK_TYPES.STRAIGHT_UP,
      } as Record<string, unknown>,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await tx.insert(leaguesTable).values(leagues);

  // Add league members
  const leagueMembers = [];
  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    const leagueUsers = users.slice(
      i * config.usersPerLeague,
      (i + 1) * config.usersPerLeague,
    );

    for (let j = 0; j < leagueUsers.length; j++) {
      const user = leagueUsers[j];
      const isCommissioner = config.commissionerUserId
        ? user.id === config.commissionerUserId
        : j === 0; // Default behavior: first user is commissioner

      leagueMembers.push({
        leagueId: league.id,
        userId: user.id,
        role: isCommissioner
          ? LEAGUE_MEMBER_ROLES.COMMISSIONER
          : LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await tx.insert(leagueMembersTable).values(leagueMembers);

  // Generate picks
  const picks = generatePicks(
    users,
    events.map((e) => ({
      id: e.id,
      week: gameSchedule[events.indexOf(e)].week,
    })),
    teams,
    leagues,
    config.phase,
    config.simulateWeek,
  );

  if (picks.length > 0) {
    await tx.insert(picksTable).values(picks);
  }

  console.log(`✅ Seeding completed successfully!`);
  console.log(
    `📈 Created ${leagues.length} leagues with ${users.length} users`,
  );
  console.log(
    `🏈 Generated ${events.length} events with ${picks.length} picks`,
  );

  return {
    users: users.map((u) => ({ id: u.id, name: u.name, email: u.email })),
    teams: teams.map((t) => ({ id: t.id, name: t.name })),
    phases: phases.map((p) => ({
      id: p.id,
      sequence: p.sequence,
      startDate: p.startDate,
      endDate: p.endDate,
    })),
    leagues: leagues.map((l) => ({
      id: l.id,
      name: l.name,
      type:
        (l.settings as Record<string, unknown>).pickType ===
        PICK_EM_PICK_TYPES.SPREAD
          ? "ATS"
          : "Straight Up",
    })),
    events: events.map((e, i) => ({
      id: e.id,
      homeTeam: teams.find((t) => t.id === e.homeTeamId)?.name || "",
      awayTeam: teams.find((t) => t.id === e.awayTeamId)?.name || "",
      week: gameSchedule[i].week,
      phaseId: e.phaseId,
    })),
  };
}
