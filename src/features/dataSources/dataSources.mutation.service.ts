import { injectable, inject } from "inversify";
import { DBOrTx, db } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { DataSourcesRepository } from "./dataSources.repository";
import { DBDataSource, DBDataSourceInsert } from "./dataSources.types";

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
