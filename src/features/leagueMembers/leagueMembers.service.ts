import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { LeagueMembersRepository } from "./leagueMembers.repository";
import {
  DBLeagueMember,
  DBLeagueMemberInsert,
  DBLeagueMemberWithProfile,
} from "./leagueMembers.types";
import { NotFoundError } from "../../lib/errors";
import { injectable, inject } from "inversify";

@injectable()
export class LeagueMembersService {
  constructor(
    @inject(TYPES.LeagueMembersRepository)
    private leagueMembersRepository: LeagueMembersRepository,
  ) {}

  async createLeagueMember(
    data: DBLeagueMemberInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMember> {
    return await this.leagueMembersRepository.create(data, dbOrTx);
  }

  async findByLeagueAndUserId(
    leagueId: string,
    userId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMember | null> {
    return await this.leagueMembersRepository.findByLeagueAndUserId(
      leagueId,
      userId,
      dbOrTx,
    );
  }

  async getByLeagueAndUserId(
    leagueId: string,
    userId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMember> {
    const member = await this.findByLeagueAndUserId(leagueId, userId, dbOrTx);
    if (!member) {
      throw new NotFoundError("League member not found");
    }

    return member;
  }

  async listByLeagueId(
    leagueId: string,
    options?: { include?: "profile"[] },
  ): Promise<(DBLeagueMember | DBLeagueMemberWithProfile)[]> {
    return await this.leagueMembersRepository.listByLeagueId(leagueId, options);
  }
}
