import { injectable, inject } from "inversify";
import { LiveScoresRepository } from "./liveScores.repository.js";
import { DBOrTx } from "../../db/index.js";
import { DBLiveScore } from "./liveScores.types.js";
import { TYPES } from "../../lib/inversify.types.js";

@injectable()
export class LiveScoresQueryService {
  constructor(
    @inject(TYPES.LiveScoresRepository)
    private liveScoresRepository: LiveScoresRepository,
  ) {}

  async findByEventId(
    eventId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLiveScore | null> {
    return this.liveScoresRepository.findByEventId(eventId, dbOrTx);
  }
}
