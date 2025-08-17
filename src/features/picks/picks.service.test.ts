import { describe, it, expect, beforeEach } from "vitest";
import { mock } from "vitest-mock-extended";
import { PicksService } from "./picks.service.js";
import { PicksQueryService } from "./picks.query.service.js";
import { PicksMutationService } from "./picks.mutation.service.js";
import { EventsQueryService } from "../events/events.query.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import { TeamsQueryService } from "../teams/teams.query.service.js";
import { LiveScoresQueryService } from "../liveScores/liveScores.query.service.js";
import { OutcomesQueryService } from "../outcomes/outcomes.query.service.js";
import { OddsQueryService } from "../odds/odds.query.service.js";
import { SportsbooksQueryService } from "../sportsbooks/sportsbooks.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { PhasesUtilService } from "../phases/phases.util.service.js";
import { PhasesQueryService } from "../phases/phases.query.service.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";
import {
  PICK_EM_PICK_TYPES,
  LEAGUE_VISIBILITIES,
  DBLeague,
} from "../leagues/leagues.types.js";
import {
  DBLeagueMember,
  LEAGUE_MEMBER_ROLES,
} from "../leagueMembers/leagueMembers.types.js";
import { DBPhase } from "../phases/phases.types.js";
import { DBEvent, EVENT_TYPES } from "../events/events.types.js";
import { DBOdds } from "../odds/odds.types.js";
import { DBPick } from "./picks.types.js";
import { vi } from "vitest";

describe("PicksService.submitPicks", () => {
  const picksQueryService = mock<PicksQueryService>();
  const picksMutationService = mock<PicksMutationService>();
  const eventsQueryService = mock<EventsQueryService>();
  const profilesQueryService = mock<ProfilesQueryService>();
  const teamsQueryService = mock<TeamsQueryService>();
  const liveScoresQueryService = mock<LiveScoresQueryService>();
  const outcomesQueryService = mock<OutcomesQueryService>();
  const oddsQueryService = mock<OddsQueryService>();
  const sportsbooksQueryService = mock<SportsbooksQueryService>();
  const leagueMembersQueryService = mock<LeagueMembersQueryService>();
  const leaguesQueryService = mock<LeaguesQueryService>();
  const phasesUtilService = mock<PhasesUtilService>();
  const phasesQueryService = mock<PhasesQueryService>();

  let service: PicksService;

  beforeEach(() => {
    service = new PicksService(
      picksQueryService,
      picksMutationService,
      eventsQueryService,
      profilesQueryService,
      teamsQueryService,
      liveScoresQueryService,
      outcomesQueryService,
      oddsQueryService,
      sportsbooksQueryService,
      leagueMembersQueryService,
      leaguesQueryService,
      phasesUtilService,
      phasesQueryService,
    );

    // Mock db.transaction
    vi.mock("../../db", () => ({
      db: {
        transaction: vi.fn((callback) => callback()),
      },
    }));

    // reset mocks
    picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockReset();
    picksMutationService.create.mockReset();
    eventsQueryService.listByPhaseIds.mockReset();
    leagueMembersQueryService.findByLeagueAndUserId.mockReset();
    leaguesQueryService.findById.mockReset();
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockReset();
    phasesQueryService.findById.mockReset();
    oddsQueryService.findByEventId.mockReset();
  });

  const baseLeague: DBLeague = {
    id: "league-1",
    name: "Test League",
    image: null,
    leagueTypeId: "lt-1",
    startPhaseTemplateId: "tpl-start",
    endPhaseTemplateId: "tpl-end",
    visibility: LEAGUE_VISIBILITIES.PRIVATE,
    size: 10,
    settings: { picksPerPhase: 2, pickType: PICK_EM_PICK_TYPES.STRAIGHT_UP },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const basePhase: DBPhase = {
    id: "phase-1",
    seasonId: "season-1",
    phaseTemplateId: "tpl-1",
    sequence: 1,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    pickLockTime: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("submits picks successfully for straight-up leagues", async () => {
    const now = new Date();
    const future1 = new Date(now.getTime() + 60 * 60 * 1000);
    const future2 = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const member: DBLeagueMember = {
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);
    leaguesQueryService.findById.mockResolvedValue(baseLeague);
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: basePhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(basePhase);
    const events: DBEvent[] = [
      {
        id: "evt-1",
        phaseId: basePhase.id,
        startTime: future1,
        type: EVENT_TYPES.GAME,
        homeTeamId: "home-1",
        awayTeamId: "away-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "evt-2",
        phaseId: basePhase.id,
        startTime: future2,
        type: EVENT_TYPES.GAME,
        homeTeamId: "home-2",
        awayTeamId: "away-2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    eventsQueryService.listByPhaseIds.mockResolvedValue(events);
    picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue([]);

    await service.submitPicks("user-1", baseLeague.id, {
      picks: [
        { eventId: "evt-1", teamId: "home-1" },
        { eventId: "evt-2", teamId: "away-2" },
      ],
    });

    expect(picksMutationService.create).toHaveBeenCalledTimes(2);
    expect(picksMutationService.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        leagueId: baseLeague.id,
        userId: "user-1",
        seasonId: basePhase.seasonId,
        eventId: "evt-1",
        teamId: "home-1",
        spread: null,
      }),
      undefined,
    );
    expect(picksMutationService.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        leagueId: baseLeague.id,
        userId: "user-1",
        seasonId: basePhase.seasonId,
        eventId: "evt-2",
        teamId: "away-2",
        spread: null,
      }),
      undefined,
    );
  });

  it("submits picks successfully for spread leagues and sets spread based on team", async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);

    const spreadLeague: DBLeague = {
      ...baseLeague,
      settings: { picksPerPhase: 1, pickType: PICK_EM_PICK_TYPES.SPREAD },
    };

    const member: DBLeagueMember = {
      leagueId: spreadLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);
    leaguesQueryService.findById.mockResolvedValue(spreadLeague);
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: basePhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(basePhase);
    const events: DBEvent[] = [
      {
        id: "evt-1",
        phaseId: basePhase.id,
        startTime: future,
        type: EVENT_TYPES.GAME,
        homeTeamId: "home-1",
        awayTeamId: "away-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    eventsQueryService.listByPhaseIds.mockResolvedValue(events);
    picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue([]);
    const odds: DBOdds = {
      id: "odds-1",
      eventId: "evt-1",
      sportsbookId: "sb-1",
      spreadHome: -3.5,
      spreadAway: 3.5,
      moneylineHome: null,
      moneylineAway: null,
      total: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    oddsQueryService.findByEventId.mockResolvedValue(odds);

    await service.submitPicks("user-1", spreadLeague.id, {
      picks: [{ eventId: "evt-1", teamId: "home-1" }],
    });

    expect(picksMutationService.create).toHaveBeenCalledTimes(1);
    expect(picksMutationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        leagueId: spreadLeague.id,
        userId: "user-1",
        seasonId: basePhase.seasonId,
        eventId: "evt-1",
        teamId: "home-1",
        spread: -3.5,
      }),
      undefined,
    );
  });

  it("throws when user is not a league member", async () => {
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

    await expect(
      // invalid by schema, but submitPicks expects parsed input; use a minimal valid shape
      service.submitPicks("user-1", "league-x", { picks: [] as never }),
    ).rejects.toThrow(
      new ForbiddenError("You are not a member of this league"),
    );
  });

  it("throws when league not found", async () => {
    const member: DBLeagueMember = {
      leagueId: "league-x",
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);
    leaguesQueryService.findById.mockResolvedValue(null);

    await expect(
      service.submitPicks("user-1", "league-x", {
        picks: [{ eventId: "e1", teamId: "t1" }],
      }),
    ).rejects.toThrow(new NotFoundError("League not found"));
  });

  it("throws when phase not found", async () => {
    const member: DBLeagueMember = {
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);
    leaguesQueryService.findById.mockResolvedValue(baseLeague);
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: "ph-x",
    });
    phasesQueryService.findById.mockResolvedValue(null);

    await expect(
      service.submitPicks("user-1", baseLeague.id, {
        picks: [{ eventId: "e1", teamId: "t1" }],
      }),
    ).rejects.toThrow(new NotFoundError("Phase not found"));
  });

  it("throws when picks are locked for the phase", async () => {
    const lockedPhase: DBPhase = {
      ...basePhase,
      pickLockTime: new Date(Date.now() - 1000),
    };

    const member: DBLeagueMember = {
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);
    leaguesQueryService.findById.mockResolvedValue(baseLeague);
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: lockedPhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(lockedPhase);

    await expect(
      service.submitPicks("user-1", baseLeague.id, {
        picks: [{ eventId: "e1", teamId: "t1" }],
      }),
    ).rejects.toThrow(new ForbiddenError("Picks are locked for this phase"));
  });

  it("throws when no events found for current phase", async () => {
    const member: DBLeagueMember = {
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);
    leaguesQueryService.findById.mockResolvedValue(baseLeague);
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: basePhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(basePhase);
    eventsQueryService.listByPhaseIds.mockResolvedValue([]);

    await expect(
      service.submitPicks("user-1", baseLeague.id, {
        picks: [{ eventId: "e1", teamId: "t1" }],
      }),
    ).rejects.toThrow(
      new NotFoundError("No events found for the current phase"),
    );
  });

  it("throws when submitted picks count does not equal required picks", async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);

    // requiredPicks = min(2, 1) = 1, we submit 2
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue({
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    leaguesQueryService.findById.mockResolvedValue(baseLeague);
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: basePhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(basePhase);
    const events: DBEvent[] = [
      {
        id: "evt-1",
        phaseId: basePhase.id,
        startTime: future,
        type: EVENT_TYPES.GAME,
        homeTeamId: "h1",
        awayTeamId: "a1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    eventsQueryService.listByPhaseIds.mockResolvedValue(events);
    picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue([]);

    await expect(
      service.submitPicks("user-1", baseLeague.id, {
        picks: [
          { eventId: "evt-1", teamId: "h1" },
          { eventId: "evt-1", teamId: "a1" },
        ],
      }),
    ).rejects.toThrowError(/You must submit exactly 1 picks for this phase/);
  });

  it("throws when existing picks already present for this phase", async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);

    const member2: DBLeagueMember = {
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member2);
    leaguesQueryService.findById.mockResolvedValue(baseLeague);
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: basePhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(basePhase);
    const events2: DBEvent[] = [
      {
        id: "evt-1",
        phaseId: basePhase.id,
        startTime: future,
        type: EVENT_TYPES.GAME,
        homeTeamId: "h1",
        awayTeamId: "a1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    eventsQueryService.listByPhaseIds.mockResolvedValue(events2);
    const existingPicks: DBPick[] = [
      {
        id: "pick-1",
        leagueId: baseLeague.id,
        userId: "user-1",
        eventId: "evt-1",
        seasonId: basePhase.seasonId,
        teamId: "h1",
        spread: null,
        result: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue(
      existingPicks,
    );

    await expect(
      service.submitPicks("user-1", baseLeague.id, {
        picks: [{ eventId: "evt-1", teamId: "h1" }],
      }),
    ).rejects.toThrow(
      new ForbiddenError("You have already made picks for this phase"),
    );
  });

  it("throws when duplicate events are submitted", async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);

    const member3: DBLeagueMember = {
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member3);
    leaguesQueryService.findById.mockResolvedValue({
      ...baseLeague,
      settings: { picksPerPhase: 2, pickType: PICK_EM_PICK_TYPES.STRAIGHT_UP },
    });
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: basePhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(basePhase);
    const events3: DBEvent[] = [
      {
        id: "evt-1",
        phaseId: basePhase.id,
        startTime: future,
        type: EVENT_TYPES.GAME,
        homeTeamId: "h1",
        awayTeamId: "a1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "evt-2",
        phaseId: basePhase.id,
        startTime: future,
        type: EVENT_TYPES.GAME,
        homeTeamId: "h2",
        awayTeamId: "a2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    eventsQueryService.listByPhaseIds.mockResolvedValue(events3);
    picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue([]);

    await expect(
      service.submitPicks("user-1", baseLeague.id, {
        picks: [
          { eventId: "evt-1", teamId: "h1" },
          { eventId: "evt-1", teamId: "a1" },
        ],
      }),
    ).rejects.toThrow(new ForbiddenError("Duplicate events are not allowed"));
  });

  it("throws when event is not part of current phase future events", async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);
    const past = new Date(now.getTime() - 60 * 60 * 1000);

    const member4: DBLeagueMember = {
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member4);
    leaguesQueryService.findById.mockResolvedValue(baseLeague);
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: basePhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(basePhase);
    // include one past and one future event in the phase; picking the past should fail
    const events4: DBEvent[] = [
      {
        id: "evt-past",
        phaseId: basePhase.id,
        startTime: past,
        type: EVENT_TYPES.GAME,
        homeTeamId: "h1",
        awayTeamId: "a1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "evt-future",
        phaseId: basePhase.id,
        startTime: future,
        type: EVENT_TYPES.GAME,
        homeTeamId: "h2",
        awayTeamId: "a2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    eventsQueryService.listByPhaseIds.mockResolvedValue(events4);
    picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue([]);

    await expect(
      service.submitPicks("user-1", baseLeague.id, {
        picks: [{ eventId: "evt-past", teamId: "h1" }],
      }),
    ).rejects.toThrow(
      new ForbiddenError("Event evt-past is not in the current phase"),
    );
  });

  it("throws when team is not part of the selected event", async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);

    const member5: DBLeagueMember = {
      leagueId: baseLeague.id,
      userId: "user-1",
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member5);
    leaguesQueryService.findById.mockResolvedValue({
      ...baseLeague,
      settings: { picksPerPhase: 1, pickType: PICK_EM_PICK_TYPES.STRAIGHT_UP },
    });
    phasesUtilService.getCurrentPhaseOnlyForLeague.mockResolvedValue({
      id: basePhase.id,
    });
    phasesQueryService.findById.mockResolvedValue(basePhase);
    const events5: DBEvent[] = [
      {
        id: "evt-1",
        phaseId: basePhase.id,
        startTime: future,
        type: EVENT_TYPES.GAME,
        homeTeamId: "h1",
        awayTeamId: "a1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    eventsQueryService.listByPhaseIds.mockResolvedValue(events5);
    picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue([]);

    await expect(
      service.submitPicks("user-1", baseLeague.id, {
        picks: [{ eventId: "evt-1", teamId: "not-in-event" }],
      }),
    ).rejects.toThrow(
      new ForbiddenError("Team not-in-event is not part of event evt-1"),
    );
  });
});
