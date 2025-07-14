import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { LeagueInvitesRepository } from "./leagueInvites.repository";
import { DBLeagueInvite, LEAGUE_INVITE_STATUSES } from "./leagueInvites.types";

@injectable()
export class LeagueInvitesQueryService {
  constructor(
    @inject(TYPES.LeagueInvitesRepository)
    private leagueInvitesRepository: LeagueInvitesRepository,
  ) {}

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBLeagueInvite | null> {
    return this.leagueInvitesRepository.findById(id, dbOrTx);
  }

  async findByInviteeLeagueAndStatus(
    inviteeId: string,
    leagueId: string,
    status: LEAGUE_INVITE_STATUSES,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueInvite | null> {
    return this.leagueInvitesRepository.findByInviteeLeagueAndStatus(
      inviteeId,
      leagueId,
      status,
      dbOrTx,
    );
  }

  async listByInviteeId(
    userId: string,
    status: LEAGUE_INVITE_STATUSES,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueInvite[]> {
    return this.leagueInvitesRepository.listByInviteeId(userId, status, dbOrTx);
  }

  async listActiveByLeagueId(
    leagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueInvite[]> {
    return this.leagueInvitesRepository.listActiveByLeagueId(leagueId, dbOrTx);
  }

  async findByToken(
    token: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueInvite | null> {
    return this.leagueInvitesRepository.findByToken(token, dbOrTx);
  }
}
