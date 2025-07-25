import { injectable, inject } from "inversify";
import { SportsbooksRepository } from "./sportsbooks.repository.js";
import { DBOrTx } from "../../db/index.js";
import {
  DBSportsbookInsert,
  DBExternalSportsbookInsert,
} from "./sportsbooks.types.js";
import { TYPES } from "../../lib/inversify.types.js";

@injectable()
export class SportsbooksMutationService {
  constructor(
    @inject(TYPES.SportsbooksRepository)
    private sportsbooksRepository: SportsbooksRepository,
  ) {}

  async create(values: DBSportsbookInsert, dbOrTx?: DBOrTx) {
    return this.sportsbooksRepository.create(values, dbOrTx);
  }

  async createExternal(values: DBExternalSportsbookInsert, dbOrTx?: DBOrTx) {
    return this.sportsbooksRepository.createExternal(values, dbOrTx);
  }
}
