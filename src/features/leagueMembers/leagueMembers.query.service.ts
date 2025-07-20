import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { LeagueMembersRepository } from "./leagueMembers.repository";
import { DBLeagueMember } from "./leagueMembers.types";

@injectable()
export class LeagueMembersQueryService {
  constructor(
    @inject(TYPES.LeagueMembersRepository)
    private leagueMembersRepository: LeagueMembersRepository,
  ) {}

  async findByLeagueAndUserId(
    leagueId: string,
    userId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMember | null> {
    return this.leagueMembersRepository.findByLeagueAndUserId(
      leagueId,
      userId,
      dbOrTx,
    );
  }

  async listByLeagueId(
    leagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMember[]> {
    return this.leagueMembersRepository.listByLeagueId(leagueId, dbOrTx);
  }

  async listByLeagueIds(
    leagueIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMember[]> {
    return this.leagueMembersRepository.listByLeagueIds(leagueIds, dbOrTx);
  }
}
