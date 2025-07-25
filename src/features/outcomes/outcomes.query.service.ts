import { injectable, inject } from "inversify";
import { OutcomesRepository } from "./outcomes.repository.js";
import { DBOrTx } from "../../db/index.js";
import { DBOutcome } from "./outcomes.types.js";
import { TYPES } from "../../lib/inversify.types.js";

@injectable()
export class OutcomesQueryService {
  constructor(
    @inject(TYPES.OutcomesRepository)
    private outcomesRepository: OutcomesRepository,
  ) {}

  async findByEventId(
    eventId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBOutcome | null> {
    return this.outcomesRepository.findByEventId(eventId, dbOrTx);
  }
}
