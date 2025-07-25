import { injectable, inject } from "inversify";
import { OutcomesRepository } from "./outcomes.repository.js";
import { DBOrTx } from "../../db/index.js";
import { DBOutcomeInsert, DBOutcomeUpdate } from "./outcomes.types.js";
import { TYPES } from "../../lib/inversify.types.js";

@injectable()
export class OutcomesMutationService {
  constructor(
    @inject(TYPES.OutcomesRepository)
    private outcomesRepository: OutcomesRepository,
  ) {}

  async create(values: DBOutcomeInsert, dbOrTx?: DBOrTx) {
    return this.outcomesRepository.create(values, dbOrTx);
  }

  async update(eventId: string, values: DBOutcomeUpdate, dbOrTx?: DBOrTx) {
    return this.outcomesRepository.update(eventId, values, dbOrTx);
  }
}
