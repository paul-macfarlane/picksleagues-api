import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { LeagueMembersRepository } from "./leagueMembers.repository";
import {
  DBLeagueMember,
  DBLeagueMemberInsert,
  DBLeagueMemberUpdate,
} from "./leagueMembers.types";

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
