import { injectable, inject } from "inversify";
import { LiveScoresRepository } from "./liveScores.repository";
import { DBOrTx } from "../../db";
import { DBLiveScore } from "./liveScores.types";
import { TYPES } from "../../lib/inversify.types";

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
