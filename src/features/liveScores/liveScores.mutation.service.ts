import { injectable, inject } from "inversify";
import { LiveScoresRepository } from "./liveScores.repository.js";
import { DBOrTx } from "../../db/index.js";
import { DBLiveScoreInsert, DBLiveScoreUpdate } from "./liveScores.types.js";
import { TYPES } from "../../lib/inversify.types.js";

@injectable()
export class LiveScoresMutationService {
  constructor(
    @inject(TYPES.LiveScoresRepository)
    private liveScoresRepository: LiveScoresRepository,
  ) {}

  async create(values: DBLiveScoreInsert, dbOrTx?: DBOrTx) {
    return this.liveScoresRepository.create(values, dbOrTx);
  }

  async update(eventId: string, values: DBLiveScoreUpdate, dbOrTx?: DBOrTx) {
    return this.liveScoresRepository.update(eventId, values, dbOrTx);
  }
}
