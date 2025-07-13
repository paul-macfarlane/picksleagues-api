import { inject, injectable } from "inversify";
import { db } from "../../db";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors";
import { TYPES } from "../../lib/inversify.types";
import { LeagueMembersService } from "../leagueMembers/leagueMembers.service";
import {
  DBLeagueInvite,
  DBLeagueInviteInsert,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
  DBLeagueInviteWithLeagueAndType,
  CreateLeagueInviteSchema,
} from "./leagueInvites.types";
import { LeagueInvitesRepository } from "./leagueInvites.repository";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types";
import { z } from "zod";
import { UsersService } from "../users/users.service";

@injectable()
export class LeagueInvitesService {
  constructor(
    @inject(TYPES.LeagueInvitesRepository)
    private leagueInvitesRepository: LeagueInvitesRepository,
    @inject(TYPES.LeagueMembersService)
    private leagueMembersService: LeagueMembersService,
    @inject(TYPES.UsersService)
    private usersService: UsersService,
  ) {}

  async create(
    userId: string,
    inviteData: z.infer<typeof CreateLeagueInviteSchema>,
  ): Promise<DBLeagueInvite> {
    return await db.transaction(async (tx) => {
      const member = await this.leagueMembersService.findByLeagueAndUserId(
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
        const invitee = await this.usersService.findById(
          inviteData.inviteeId,
          tx,
        );
        if (!invitee) {
          throw new NotFoundError("Invitee not found");
        }

        const inviteeMember =
          await this.leagueMembersService.findByLeagueAndUserId(
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
          await this.leagueInvitesRepository.findByInviteeLeagueAndStatus(
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

      const invite = await this.leagueInvitesRepository.create(
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
      const invite = await this.leagueInvitesRepository.findById(inviteId, tx);
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

      const member = await this.leagueMembersService.findByLeagueAndUserId(
        invite.leagueId,
        userId,
        tx,
      );
      if (member) {
        throw new ConflictError("You are already a member of the league");
      }

      await this.leagueInvitesRepository.update(
        inviteId,
        { status: response },
        tx,
      );

      if (response === LEAGUE_INVITE_STATUSES.ACCEPTED) {
        await this.leagueMembersService.createLeagueMember(
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

  async listPendingByUserIdWithLeagueAndType(
    userId: string,
  ): Promise<DBLeagueInviteWithLeagueAndType[]> {
    return await this.leagueInvitesRepository.listWithLeagueAndTypeByInviteeIdAndOptionalStatus(
      userId,
      LEAGUE_INVITE_STATUSES.PENDING,
    );
  }

  async listPendingByLeagueIdWithLeagueAndType(
    leagueId: string,
  ): Promise<DBLeagueInviteWithLeagueAndType[]> {
    return await this.leagueInvitesRepository.listWithLeagueAndTypeByLeagueId(
      leagueId,
    );
  }

  async revoke(userId: string, inviteId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const invite = await this.leagueInvitesRepository.findById(inviteId, tx);
      if (!invite) {
        throw new NotFoundError("Invite not found");
      }

      const member = await this.leagueMembersService.findByLeagueAndUserId(
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

      await this.leagueInvitesRepository.delete(inviteId, tx);
    });
  }

  async findByTokenWithLeagueAndType(
    token: string,
  ): Promise<DBLeagueInviteWithLeagueAndType | null> {
    return await this.leagueInvitesRepository.findWithLeagueAndTypeByToken(
      token,
    );
  }

  async getByTokenWithLeagueAndType(
    token: string,
  ): Promise<DBLeagueInviteWithLeagueAndType> {
    const invite = await this.findByTokenWithLeagueAndType(token);
    if (!invite) {
      throw new NotFoundError("Invite not found");
    }
    return invite;
  }

  async joinWithToken(userId: string, token: string): Promise<void> {
    await db.transaction(async (tx) => {
      const invite = await this.leagueInvitesRepository.findByToken(token, tx);
      if (!invite) {
        throw new NotFoundError("Invite not found");
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        await this.leagueInvitesRepository.delete(invite.id, tx);
        throw new ValidationError("Invite has expired");
      }

      const member = await this.leagueMembersService.findByLeagueAndUserId(
        invite.leagueId,
        userId,
        tx,
      );
      if (member) {
        // silently succeed
        return;
      }

      await this.leagueMembersService.createLeagueMember(
        {
          leagueId: invite.leagueId,
          userId,
          role: invite.role,
        },
        tx,
      );
    });
  }
}
