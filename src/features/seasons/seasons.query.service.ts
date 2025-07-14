import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { SeasonsRepository } from "./seasons.repository";
import { DBExternalSeason } from "./seasons.types";

@injectable()
export class SeasonsQueryService {
  constructor(
    @inject(TYPES.SeasonsRepository)
    private seasonsRepository: SeasonsRepository,
  ) {}

  async findExternalBySourceAndId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSeason | null> {
    return this.seasonsRepository.findExternalBySourceAndId(
      dataSourceId,
      externalId,
      dbOrTx,
    );
  }
}
