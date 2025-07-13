import { inject, injectable } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { LeagueMembersRepository } from "./leagueMembers.repository";
import { DBLeagueMember, DBLeagueMemberInsert } from "./leagueMembers.types";
import { DBLeagueMemberWithProfile } from "./leagueMembers.types";
import { NotFoundError } from "../../lib/errors";

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

  async listByLeagueIdWithProfile(
    leagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueMemberWithProfile[]> {
    return await this.leagueMembersRepository.listByLeagueIdWithProfile(
      leagueId,
      dbOrTx,
    );
  }
}
