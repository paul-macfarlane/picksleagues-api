import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { NotFoundError } from "../../lib/errors";
import { DBDataSource, DATA_SOURCE_NAMES } from "./dataSources.types";
import { DataSourcesRepository } from "./dataSources.repository";
import { db, DBOrTx } from "../../db";

@injectable()
export class DataSourcesService {
  constructor(
    @inject(TYPES.DataSourcesRepository)
    private dataSourcesRepository: DataSourcesRepository,
  ) {}

  async findByName(
    name: DATA_SOURCE_NAMES,
    dbOrTx: DBOrTx = db,
  ): Promise<DBDataSource | null> {
    return await this.dataSourcesRepository.findByName(name, dbOrTx);
  }

  async getByName(name: DATA_SOURCE_NAMES): Promise<DBDataSource> {
    const dataSource = await this.findByName(name);
    if (!dataSource) {
      throw new NotFoundError("Data source not found");
    }
    return dataSource;
  }

  async findOrCreateByName(
    name: DATA_SOURCE_NAMES,
    dbOrTx: DBOrTx = db,
  ): Promise<DBDataSource> {
    const existing = await this.findByName(name, dbOrTx);
    if (existing) {
      return existing;
    }

    return this.dataSourcesRepository.create({ name }, dbOrTx);
  }
}
