import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { DBDataSource, DATA_SOURCE_NAMES } from "./dataSources.types.js";
import { db, DBOrTx } from "../../db/index.js";
import { DataSourcesQueryService } from "./dataSources.query.service.js";
import { DataSourcesMutationService } from "./dataSources.mutation.service.js";

@injectable()
export class DataSourcesService {
  constructor(
    @inject(TYPES.DataSourcesQueryService)
    private dataSourcesQueryService: DataSourcesQueryService,
    @inject(TYPES.DataSourcesMutationService)
    private dataSourcesMutationService: DataSourcesMutationService,
  ) {}

  async findOrCreateByName(
    name: DATA_SOURCE_NAMES,
    dbOrTx: DBOrTx = db,
  ): Promise<DBDataSource> {
    const existing = await this.dataSourcesQueryService.findByName(
      name,
      dbOrTx,
    );
    if (existing) {
      return existing;
    }

    return this.dataSourcesMutationService.create({ name }, dbOrTx);
  }
}
