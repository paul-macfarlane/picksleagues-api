import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeagueMembersRepository } from "./leagueMembers.repository.js";
import { DBLeagueMember } from "./leagueMembers.types.js";

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
