import { injectable, inject } from "inversify";
import { SportsbooksRepository } from "./sportsbooks.repository";
import { DBOrTx } from "../../db";
import {
  DBSportsbookInsert,
  DBExternalSportsbookInsert,
} from "./sportsbooks.types";
import { TYPES } from "../../lib/inversify.types";

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
