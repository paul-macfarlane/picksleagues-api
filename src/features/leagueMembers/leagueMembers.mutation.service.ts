import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeagueMembersRepository } from "./leagueMembers.repository.js";
import {
  DBLeagueMember,
  DBLeagueMemberInsert,
  DBLeagueMemberUpdate,
} from "./leagueMembers.types.js";

@injectable()
export class LeagueMembersMutationService {
  constructor(
    @inject(TYPES.LeagueMembersRepository)
    private leagueMembersRepository: LeagueMembersRepository,
  ) {}

  async update(
    leagueId: string,
    userId: string,
    data: DBLeagueMemberUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMember> {
    return this.leagueMembersRepository.update(leagueId, userId, data, dbOrTx);
  }

  async delete(
    leagueId: string,
    userId: string,
    dbOrTx?: DBOrTx,
  ): Promise<void> {
    return this.leagueMembersRepository.delete(leagueId, userId, dbOrTx);
  }

  async createLeagueMember(
    data: DBLeagueMemberInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMember> {
    return this.leagueMembersRepository.create(data, dbOrTx);
  }

  async deleteByUserId(userId: string, dbOrTx?: DBOrTx): Promise<void> {
    return this.leagueMembersRepository.deleteByUserId(userId, dbOrTx);
  }
}
