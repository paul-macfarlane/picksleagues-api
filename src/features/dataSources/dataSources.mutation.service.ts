import { injectable, inject } from "inversify";
import { DBOrTx, db } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { DataSourcesRepository } from "./dataSources.repository.js";
import { DBDataSource, DBDataSourceInsert } from "./dataSources.types.js";

@injectable()
export class DataSourcesMutationService {
  constructor(
    @inject(TYPES.DataSourcesRepository)
    private dataSourcesRepository: DataSourcesRepository,
  ) {}

  async create(
    data: DBDataSourceInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBDataSource> {
    return this.dataSourcesRepository.create(data, dbOrTx);
  }
}
