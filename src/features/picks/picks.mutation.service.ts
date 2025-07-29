import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { PicksRepository } from "./picks.repository.js";
import { DBPickInsert, DBPick, DBPickUpdate } from "./picks.types.js";
import { DBOrTx, db } from "../../db/index.js";

@injectable()
export class PicksMutationService {
  constructor(
    @inject(TYPES.PicksRepository)
    private picksRepository: PicksRepository,
  ) {}

  async create(pick: DBPickInsert, dbOrTx: DBOrTx = db): Promise<DBPick> {
    return this.picksRepository.create(pick, dbOrTx);
  }

  async update(
    id: string,
    pick: DBPickUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick> {
    return this.picksRepository.update(id, pick, dbOrTx);
  }
}
