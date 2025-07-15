import { injectable, inject } from "inversify";
import { DBOrTx, db } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { DataSourcesRepository } from "./dataSources.repository";
import { DBDataSource, DATA_SOURCE_NAMES } from "./dataSources.types";

@injectable()
export class DataSourcesQueryService {
  constructor(
    @inject(TYPES.DataSourcesRepository)
    private dataSourcesRepository: DataSourcesRepository,
  ) {}

  async findByName(
    name: DATA_SOURCE_NAMES,
    dbOrTx: DBOrTx = db,
  ): Promise<DBDataSource | null> {
    return this.dataSourcesRepository.findByName(name, dbOrTx);
  }
}
