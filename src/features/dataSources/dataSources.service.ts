import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { DBDataSource, DATA_SOURCE_NAMES } from "./dataSources.types";
import { db, DBOrTx } from "../../db";
import { DataSourcesQueryService } from "./dataSources.query.service";
import { DataSourcesMutationService } from "./dataSources.mutation.service";

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
