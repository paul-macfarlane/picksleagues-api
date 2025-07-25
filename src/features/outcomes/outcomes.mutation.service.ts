import { injectable, inject } from "inversify";
import { OutcomesRepository } from "./outcomes.repository";
import { DBOrTx } from "../../db";
import { DBOutcomeInsert, DBOutcomeUpdate } from "./outcomes.types";
import { TYPES } from "../../lib/inversify.types";

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
