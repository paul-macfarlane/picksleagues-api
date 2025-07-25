import { injectable, inject } from "inversify";
import { OutcomesRepository } from "./outcomes.repository";
import { DBOrTx } from "../../db";
import { DBOutcome } from "./outcomes.types";
import { TYPES } from "../../lib/inversify.types";

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
