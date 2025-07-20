import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { LeagueInvitesRepository } from "./leagueInvites.repository";
import {
  DBLeagueInvite,
  DBLeagueInviteInsert,
  DBLeagueInviteUpdate,
} from "./leagueInvites.types";

@injectable()
export class LeagueInvitesMutationService {
  constructor(
    @inject(TYPES.LeagueInvitesRepository)
    private leagueInvitesRepository: LeagueInvitesRepository,
  ) {}

  async create(
    data: DBLeagueInviteInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueInvite> {
    return this.leagueInvitesRepository.create(data, dbOrTx);
  }

  async update(
    id: string,
    data: DBLeagueInviteUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueInvite> {
    return this.leagueInvitesRepository.update(id, data, dbOrTx);
  }

  async delete(id: string, dbOrTx?: DBOrTx): Promise<void> {
    return this.leagueInvitesRepository.delete(id, dbOrTx);
  }

  async deleteByIds(ids: string[], dbOrTx?: DBOrTx): Promise<void> {
    return this.leagueInvitesRepository.deleteByIds(ids, dbOrTx);
  }
}
