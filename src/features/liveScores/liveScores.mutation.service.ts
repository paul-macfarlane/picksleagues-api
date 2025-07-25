import { injectable, inject } from "inversify";
import { LiveScoresRepository } from "./liveScores.repository";
import { DBOrTx } from "../../db";
import { DBLiveScoreInsert, DBLiveScoreUpdate } from "./liveScores.types";
import { TYPES } from "../../lib/inversify.types";

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
