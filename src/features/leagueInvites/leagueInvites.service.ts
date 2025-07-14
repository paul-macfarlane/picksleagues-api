import { inject, injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors";
import { TYPES } from "../../lib/inversify.types";
import {
  DBLeagueInvite,
  DBLeagueInviteInsert,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
  CreateLeagueInviteSchema,
  PopulatedDBLeagueInvite,
  LeagueInviteIncludeSchema,
  LEAGUE_INVITE_INCLUDES,
} from "./leagueInvites.types";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types";
import { z } from "zod";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service";
import { UsersQueryService } from "../users/users.query.service";
import { LeagueInvitesMutationService } from "./leagueInvites.mutation.service";
import { LeagueInvitesQueryService } from "./leagueInvites.query.service";
import { DBLeague } from "../leagues/leagues.types";
import { LeaguesQueryService } from "../leagues/leagues.query.service";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service";

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
  ) {}

  // Orchestration Methods (Mutations)

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

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        throw new ValidationError("Invite has expired");
      }

      if (invite.status !== LEAGUE_INVITE_STATUSES.PENDING) {
        throw new ValidationError("Invite is not pending");
      }

      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        invite.leagueId,
        userId,
        tx,
      );
      if (member) {
        throw new ConflictError("You are already a member of the league");
      }

      await this.leagueInvitesMutationService.update(
        inviteId,
        { status: response },
        tx,
      );

      if (response === LEAGUE_INVITE_STATUSES.ACCEPTED) {
        await this.leagueMembersMutationService.createLeagueMember(
          {
            leagueId: invite.leagueId,
            userId,
            role: invite.role,
          },
          tx,
        );
      }
    });
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

  async joinWithToken(userId: string, token: string): Promise<void> {
    await db.transaction(async (tx) => {
      const invite = await this.leagueInvitesQueryService.findByToken(
        token,
        tx,
      );
      if (!invite) {
        throw new NotFoundError("Invite not found");
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        await this.leagueInvitesMutationService.delete(invite.id, tx);
        throw new ValidationError("Invite has expired");
      }

      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        invite.leagueId,
        userId,
        tx,
      );
      if (member) {
        // silently succeed
        return;
      }

      await this.leagueMembersMutationService.createLeagueMember(
        {
          leagueId: invite.leagueId,
          userId,
          role: invite.role,
        },
        tx,
      );
    });
  }

  // Orchestration Methods (Queries)

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
    let leagues: DBLeague[] = [];

    if (includes.has("league")) {
      const leagueIds = populatedInvites
        .map((invite) => invite.leagueId)
        .filter((id): id is string => !!id);
      leagues = await this.leaguesQueryService.listByIds(leagueIds, dbOrTx);
      const leaguesById = new Map(leagues.map((l) => [l.id, l]));

      for (const invite of populatedInvites) {
        if (invite.leagueId) {
          invite.league = leaguesById.get(invite.leagueId);
        }
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

    return populatedInvites;
  }
}
