import { LEAGUE_TYPE_SLUGS, DBLeagueType } from "./leagueTypes.types";
import { NotFoundError } from "../../lib/errors";
import { db, DBOrTx } from "../../db";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { LeagueTypesRepository } from "./leagueTypes.repository";
import { z } from "zod";
import { DBLeagueTypeInsert } from "./leagueTypes.types";

@injectable()
export class LeagueTypesService {
  constructor(
    @inject(TYPES.LeagueTypesRepository)
    private leagueTypesRepository: LeagueTypesRepository,
  ) {}

  async create(
    data: DBLeagueTypeInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueType> {
    return await this.leagueTypesRepository.create(data, dbOrTx);
  }

  async findOrCreateBySlug(
    data: DBLeagueTypeInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueType> {
    const existing = await this.findByIdOrSlug(data.slug, dbOrTx);
    if (existing) {
      return existing;
    }
    return await this.create(data, dbOrTx);
  }

  async findByIdOrSlug(
    typeIdOrSlug: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueType | null> {
    let leagueType: DBLeagueType | null = null;
    const isId = z.string().uuid().safeParse(typeIdOrSlug).success;

    if (isId) {
      leagueType = await this.leagueTypesRepository.findById(
        typeIdOrSlug,
        dbOrTx,
      );
    } else {
      leagueType = await this.leagueTypesRepository.findBySlug(
        typeIdOrSlug as LEAGUE_TYPE_SLUGS,
        dbOrTx,
      );
    }

    return leagueType;
  }

  async getByIdOrSlug(
    typeIdOrSlug: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueType> {
    const leagueType = await this.findByIdOrSlug(typeIdOrSlug, dbOrTx);
    if (!leagueType) {
      throw new NotFoundError("League type not found");
    }

    return leagueType;
  }
}
