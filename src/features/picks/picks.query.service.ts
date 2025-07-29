import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { PicksRepository } from "./picks.repository.js";
import { DBPick, UnassessedPick } from "./picks.types.js";

@injectable()
export class PicksQueryService {
  constructor(
    @inject(TYPES.PicksRepository)
    private picksRepository: PicksRepository,
  ) {}

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBPick | null> {
    return this.picksRepository.findById(id, dbOrTx);
  }

  async findByUserIdAndLeagueId(
    userId: string,
    leagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBPick[]> {
    return this.picksRepository.findByUserIdAndLeagueId(
      userId,
      leagueId,
      dbOrTx,
    );
  }

  async findByUserIdAndEventIds(
    userId: string,
    eventIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBPick[]> {
    return this.picksRepository.findByUserIdAndEventIds(
      userId,
      eventIds,
      dbOrTx,
    );
  }

  async findByLeagueIdAndEventIds(
    leagueId: string,
    eventIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBPick[]> {
    return this.picksRepository.findByLeagueIdAndEventIds(
      leagueId,
      eventIds,
      dbOrTx,
    );
  }

  async findByLeagueIdAndEventIdsForMembers(
    leagueId: string,
    eventIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBPick[]> {
    return this.picksRepository.findByLeagueIdAndEventIdsForMembers(
      leagueId,
      eventIds,
      dbOrTx,
    );
  }

  async findByUserIdAndLeagueIdAndEventIds(
    userId: string,
    leagueId: string,
    eventIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBPick[]> {
    return this.picksRepository.findByUserIdAndLeagueIdAndEventIds(
      userId,
      leagueId,
      eventIds,
      dbOrTx,
    );
  }

  async findUnassessedPicksForLeague(
    leagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<UnassessedPick[]> {
    return this.picksRepository.findUnassessedPicksForLeague(leagueId, dbOrTx);
  }
}
