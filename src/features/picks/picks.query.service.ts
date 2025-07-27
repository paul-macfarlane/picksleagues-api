import { injectable, inject } from "inversify";
import { DBOrTx, db } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { PicksRepository } from "./picks.repository.js";
import { DBPick } from "./picks.types.js";

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

  async findByUserIdAndLeagueIdAndEventIds(
    userId: string,
    leagueId: string,
    eventIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick[]> {
    return this.picksRepository.findByUserIdAndLeagueIdAndEventIds(
      userId,
      leagueId,
      eventIds,
      dbOrTx,
    );
  }

  async findByUserIdAndLeagueIdAndEventId(
    userId: string,
    leagueId: string,
    eventId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick | null> {
    return this.picksRepository.findByUserIdAndLeagueIdAndEventId(
      userId,
      leagueId,
      eventId,
      dbOrTx,
    );
  }
}
