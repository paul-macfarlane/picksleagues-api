import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeagueInvitesRepository } from "./leagueInvites.repository.js";
import {
  DBLeagueInvite,
  DBLeagueInviteInsert,
  DBLeagueInviteUpdate,
} from "./leagueInvites.types.js";

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
