import { inject, injectable } from "inversify";
import { db, DBOrTx, DBTx } from "../../db/index.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors.js";
import { TYPES } from "../../lib/inversify.types.js";
import {
  DBLeagueInvite,
  DBLeagueInviteInsert,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
  CreateLeagueInviteSchema,
  PopulatedDBLeagueInvite,
  LeagueInviteIncludeSchema,
  LEAGUE_INVITE_INCLUDES,
} from "./leagueInvites.types.js";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types.js";
import { z } from "zod";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service.js";
import { UsersQueryService } from "../users/users.query.service.js";
import { LeagueInvitesMutationService } from "./leagueInvites.mutation.service.js";
import { LeagueInvitesQueryService } from "./leagueInvites.query.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import { LeaguesUtilService } from "../leagues/leagues.util.service.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";
import { StandingsMutationService } from "../standings/standings.mutation.service.js";

@injectable()
export class LeagueInvitesService {
  constructor(
    @inject(TYPES.LeagueInvitesQueryService)
    private leagueInvitesQueryService: LeagueInvitesQueryService,
    @inject(TYPES.LeagueInvitesMutationService)
    private leagueInvitesMutationService: LeagueInvitesMutationService,
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.LeagueMembersMutationService)
    private leagueMembersMutationService: LeagueMembersMutationService,
    @inject(TYPES.UsersQueryService)
    private usersQueryService: UsersQueryService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeagueTypesQueryService)
    private leagueTypesQueryService: LeagueTypesQueryService,
    @inject(TYPES.ProfilesQueryService)
    private profilesQueryService: ProfilesQueryService,
    @inject(TYPES.LeaguesUtilService)
    private leaguesUtilService: LeaguesUtilService,
    @inject(TYPES.SeasonsUtilService)
    private seasonsUtilService: SeasonsUtilService,
    @inject(TYPES.StandingsMutationService)
    private standingsMutationService: StandingsMutationService,
  ) {}

  // Private helper method to clean up pending invites
  private async cleanupPendingInvites(
    leagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<void> {
    const pendingInvites =
      await this.leagueInvitesQueryService.listActiveByLeagueId(
        leagueId,
        dbOrTx,
      );

    // Delete all pending invites that haven't expired
    if (pendingInvites?.length > 0) {
      await this.leagueInvitesMutationService.deleteByIds(
        pendingInvites.map((i) => i.id),
        dbOrTx,
      );
    }
  }

  // Private helper method to respond to an invite and clean up pending invites
  private async respondAndCleanup(
    userId: string,
    invite: DBLeagueInvite,
    response:
      | LEAGUE_INVITE_STATUSES.ACCEPTED
      | LEAGUE_INVITE_STATUSES.DECLINED
      | null,
    tx: DBTx,
  ): Promise<{
    leagueIsAtCapacity: boolean;
    leagueIsInProgress: boolean;
    memberWasAdded: boolean;
  }> {
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new ValidationError("Invite has expired");
    }

    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      invite.leagueId,
      userId,
      tx,
    );
    if (member) {
      return {
        leagueIsAtCapacity: false,
        leagueIsInProgress: false,
        memberWasAdded: false,
      }; // silently succeed if user is already a member
    }

    const league = await this.leaguesQueryService.findById(invite.leagueId, tx);
    if (!league) {
      // this should never happen because of data integrity, but have to handle it
      throw new Error("League not found for invite");
    }

    if (response === LEAGUE_INVITE_STATUSES.DECLINED) {
      await this.leagueInvitesMutationService.update(
        invite.id,
        { status: response },
        tx,
      );
      return {
        leagueIsAtCapacity: false,
        leagueIsInProgress: false,
        memberWasAdded: false,
      };
    }

    const leagueCapacity = await this.leaguesUtilService.getLeagueCapacity(
      league,
      tx,
    );
    const leagueIsInProgress =
      await this.leaguesUtilService.leagueSeasonInProgress(league, tx);

    // Check if league would be at capacity after adding this member
    const currentMembers = await this.leagueMembersQueryService.listByLeagueId(
      invite.leagueId,
      tx,
    );
    const leagueIsAtCapacity = currentMembers.length >= leagueCapacity;

    if (leagueIsInProgress) {
      // League is in progress, so we can't accept new members
      await this.cleanupPendingInvites(invite.leagueId, tx);
      return {
        leagueIsAtCapacity: false,
        leagueIsInProgress: true,
        memberWasAdded: false,
      };
    }

    if (leagueIsAtCapacity) {
      // League is at capacity, so we can't accept new members
      await this.cleanupPendingInvites(invite.leagueId, tx);
      return {
        leagueIsAtCapacity: true,
        leagueIsInProgress: false,
        memberWasAdded: false,
      };
    }

    // League has capacity and is not in progress, so we can accept the member
    await this.leagueInvitesMutationService.update(
      invite.id,
      { status: response },
      tx,
    );

    if (
      response === LEAGUE_INVITE_STATUSES.ACCEPTED ||
      response === null // link invites are accepted by default
    ) {
      await this.leagueMembersMutationService.createLeagueMember(
        {
          leagueId: invite.leagueId,
          userId,
          role: invite.role,
        },
        tx,
      );

      const leagueType = await this.leagueTypesQueryService.findById(
        league.leagueTypeId,
        tx,
      );
      if (!leagueType) {
        throw new NotFoundError("League type not found");
      }

      const season =
        await this.seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId(
          leagueType.sportLeagueId,
          tx,
        );
      if (!season) {
        throw new NotFoundError(
          "Season not found to create standings record for new member",
        );
      }

      // create standings record for the new member
      await this.standingsMutationService.create(
        {
          userId,
          leagueId: invite.leagueId,
          seasonId: season.id,
          points: 0,
          metadata: {
            wins: 0,
            losses: 0,
            pushes: 0,
          },
        },
        tx,
      );

      // Check if the league is now at capacity after adding this member
      const updatedMembers =
        await this.leagueMembersQueryService.listByLeagueId(
          invite.leagueId,
          tx,
        );
      const isNowAtCapacity = updatedMembers.length >= leagueCapacity;

      if (isNowAtCapacity) {
        // League just reached capacity, clean up pending invites
        await this.cleanupPendingInvites(invite.leagueId, tx);
        return {
          leagueIsAtCapacity: true,
          leagueIsInProgress: false,
          memberWasAdded: true,
        };
      }
    }

    return {
      leagueIsAtCapacity: false,
      leagueIsInProgress: false,
      memberWasAdded: true,
    };
  }

  async create(
    userId: string,
    inviteData: z.infer<typeof CreateLeagueInviteSchema>,
  ): Promise<DBLeagueInvite> {
    return await db.transaction(async (tx) => {
      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        inviteData.leagueId,
        userId,
        tx,
      );
      if (!member) {
        throw new ForbiddenError("You are not a member of this league");
      }

      if (member.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER) {
        throw new ForbiddenError("You are not a commissioner");
      }

      const league = await this.leaguesQueryService.findById(
        inviteData.leagueId,
        tx,
      );
      if (!league) {
        throw new NotFoundError("League not found");
      }

      const leagueCapacity = await this.leaguesUtilService.getLeagueCapacity(
        league,
        tx,
      );
      const currentMembers =
        await this.leagueMembersQueryService.listByLeagueId(
          inviteData.leagueId,
          tx,
        );
      if (currentMembers.length >= leagueCapacity) {
        throw new ValidationError("League is at capacity");
      }

      const leagueIsInProgress =
        await this.leaguesUtilService.leagueSeasonInProgress(league, tx);
      if (leagueIsInProgress) {
        throw new ValidationError("League's season is in progress");
      }

      if (
        inviteData.type === LEAGUE_INVITE_TYPES.DIRECT &&
        inviteData.inviteeId
      ) {
        const invitee = await this.usersQueryService.findById(
          inviteData.inviteeId,
          tx,
        );
        if (!invitee) {
          throw new NotFoundError("Invitee not found");
        }

        const inviteeMember =
          await this.leagueMembersQueryService.findByLeagueAndUserId(
            inviteData.leagueId,
            inviteData.inviteeId,
            tx,
          );
        if (inviteeMember) {
          throw new ConflictError(
            "Invitee is already a member of this league.",
          );
        }

        const existingInvite =
          await this.leagueInvitesQueryService.findByInviteeLeagueAndStatus(
            inviteData.inviteeId,
            inviteData.leagueId,
            LEAGUE_INVITE_STATUSES.PENDING,
            tx,
          );
        if (existingInvite) {
          throw new ConflictError(
            "User has already been invited to the league",
          );
        }
      }

      const expiresAt = new Date(
        Date.now() + inviteData.expiresInDays * 24 * 60 * 60 * 1000,
      );

      const inviteToInsert: DBLeagueInviteInsert = {
        inviterId: userId,
        leagueId: inviteData.leagueId,
        type: inviteData.type,
        expiresAt,
        role: inviteData.role,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        ...(inviteData.type === LEAGUE_INVITE_TYPES.DIRECT
          ? { inviteeId: inviteData.inviteeId }
          : { token: crypto.randomUUID() }),
      };

      if (
        inviteData.type === LEAGUE_INVITE_TYPES.DIRECT &&
        !inviteToInsert.inviteeId
      ) {
        throw new ValidationError("Invitee ID is required for direct invites");
      }

      const invite = await this.leagueInvitesMutationService.create(
        inviteToInsert,
        tx,
      );
      return invite;
    });
  }

  async respond(
    userId: string,
    inviteId: string,
    response: LEAGUE_INVITE_STATUSES.ACCEPTED | LEAGUE_INVITE_STATUSES.DECLINED,
  ): Promise<void> {
    let leagueIsAtCapacity = false;
    let leagueIsInProgress = false;
    let memberWasAdded = false;

    await db.transaction(async (tx) => {
      const invite = await this.leagueInvitesQueryService.findById(
        inviteId,
        tx,
      );
      if (!invite) {
        throw new NotFoundError("Invite not found");
      }

      if (invite.inviteeId !== userId) {
        throw new ForbiddenError("You are not the invitee");
      }

      if (invite.status !== LEAGUE_INVITE_STATUSES.PENDING) {
        throw new ValidationError("Invite already responded to");
      }

      const {
        leagueIsAtCapacity: leagueIsAtCapacityFromCleanup,
        leagueIsInProgress: leagueIsInProgressFromCleanup,
        memberWasAdded: memberWasAddedFromCleanup,
      } = await this.respondAndCleanup(userId, invite, response, tx);

      leagueIsAtCapacity = leagueIsAtCapacityFromCleanup;
      leagueIsInProgress = leagueIsInProgressFromCleanup;
      memberWasAdded = memberWasAddedFromCleanup;
    });

    // Only throw error if the league was already at capacity before adding the member
    // If the league became at capacity by adding this member, that's fine
    if (leagueIsAtCapacity && !memberWasAdded) {
      throw new ValidationError("League is at capacity");
    }

    if (leagueIsInProgress) {
      throw new ValidationError("League's season is in progress");
    }
  }

  async joinWithToken(userId: string, token: string): Promise<void> {
    let leagueIsAtCapacity = false;
    let leagueIsInProgress = false;

    await db.transaction(async (tx) => {
      const invite = await this.leagueInvitesQueryService.findByToken(
        token,
        tx,
      );
      if (!invite) {
        throw new NotFoundError("Invite not found");
      }

      const {
        leagueIsAtCapacity: leagueIsAtCapacityFromCleanup,
        leagueIsInProgress: leagueIsInProgressFromCleanup,
      } = await this.respondAndCleanup(
        userId,
        invite,
        null, // responding to a link is an accept by default
        tx,
      );

      leagueIsAtCapacity = leagueIsAtCapacityFromCleanup;
      leagueIsInProgress = leagueIsInProgressFromCleanup;
    });

    if (leagueIsAtCapacity) {
      throw new ValidationError("League is at capacity");
    }

    if (leagueIsInProgress) {
      throw new ValidationError("League's season is in progress");
    }
  }

  async revoke(userId: string, inviteId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const invite = await this.leagueInvitesQueryService.findById(
        inviteId,
        tx,
      );
      if (!invite) {
        throw new NotFoundError("Invite not found");
      }

      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        invite.leagueId,
        userId,
        tx,
      );
      if (!member) {
        throw new ForbiddenError("You are not a member of this league");
      }

      if (member.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER) {
        throw new ForbiddenError("You are not a commissioner of this league");
      }

      await this.leagueInvitesMutationService.delete(inviteId, tx);
    });
  }

  async getMyInvites(
    userId: string,
    query: z.infer<typeof LeagueInviteIncludeSchema>,
  ): Promise<PopulatedDBLeagueInvite[]> {
    const invites = await this.leagueInvitesQueryService.listByInviteeId(
      userId,
      LEAGUE_INVITE_STATUSES.PENDING,
    );
    return this.populateInvites(invites, query);
  }

  async getInviteByToken(
    token: string,
    query: z.infer<typeof LeagueInviteIncludeSchema>,
  ): Promise<PopulatedDBLeagueInvite> {
    const invite = await this.leagueInvitesQueryService.findByToken(token);
    if (!invite) {
      throw new NotFoundError("Invite not found");
    }
    const populated = await this.populateInvites([invite], query);

    return populated[0];
  }

  async listByLeagueIdForUser(
    userId: string,
    leagueId: string,
    query: z.infer<typeof LeagueInviteIncludeSchema>,
    dbOrTx?: DBOrTx,
  ): Promise<PopulatedDBLeagueInvite[]> {
    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      leagueId,
      userId,
      dbOrTx,
    );
    if (!member || member.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER) {
      throw new ForbiddenError("You are not a member of this league");
    }

    const invites = await this.leagueInvitesQueryService.listActiveByLeagueId(
      leagueId,
      dbOrTx,
    );

    return this.populateInvites(invites, query, dbOrTx);
  }

  // making this static and exposing because leagues service also uses this
  private async populateInvites(
    invites: DBLeagueInvite[],
    query: z.infer<typeof LeagueInviteIncludeSchema>,
    dbOrTx?: DBOrTx,
  ): Promise<PopulatedDBLeagueInvite[]> {
    if (!query?.include || query.include.length === 0) {
      return invites;
    }

    const populatedInvites: PopulatedDBLeagueInvite[] = invites;
    const includes = new Set(query.include);

    if (includes.has(LEAGUE_INVITE_INCLUDES.INVITEE)) {
      const inviteeIds = populatedInvites
        .map((invite) => invite.inviteeId)
        .filter((id): id is string => !!id);
      const profiles = await this.profilesQueryService.listByUserIds(
        inviteeIds,
        dbOrTx,
      );
      const profilesById = new Map(profiles.map((p) => [p.userId, p]));

      for (const invite of populatedInvites) {
        if (invite.inviteeId) {
          invite.invitee = profilesById.get(invite.inviteeId);
        }
      }
    }

    if (includes.has(LEAGUE_INVITE_INCLUDES.LEAGUE)) {
      const leagueIds = populatedInvites
        .map((invite) => invite.leagueId)
        .filter((id): id is string => !!id);
      const leagues = await this.leaguesQueryService.listByIds(
        leagueIds,
        dbOrTx,
      );
      const leaguesById = new Map(leagues.map((l) => [l.id, l]));

      for (const invite of populatedInvites) {
        if (invite.leagueId) {
          invite.league = leaguesById.get(invite.leagueId);
        }
      }

      if (includes.has(LEAGUE_INVITE_INCLUDES.LEAGUE_TYPE)) {
        const leagueTypeIds = leagues
          .map((l) => l.leagueTypeId)
          .filter((id): id is string => !!id);

        const leagueTypes = await this.leagueTypesQueryService.listByIds(
          leagueTypeIds,
          dbOrTx,
        );
        const leagueTypesById = new Map(leagueTypes.map((lt) => [lt.id, lt]));

        for (const invite of populatedInvites) {
          if (invite.league) {
            invite.league.leagueType = leagueTypesById.get(
              invite.league.leagueTypeId,
            );
          }
        }
      }
    }

    return populatedInvites;
  }
}
