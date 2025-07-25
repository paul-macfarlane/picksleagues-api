import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeagueInvitesRepository } from "./leagueInvites.repository.js";
import { DBLeagueInvite, LEAGUE_INVITE_STATUSES } from "./leagueInvites.types.js";

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
