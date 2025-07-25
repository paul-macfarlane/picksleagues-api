import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { ProfilesRepository } from "./profiles.repository.js";
import { DBProfile, DBProfileInsert, DBProfileUpdate } from "./profiles.types.js";

@injectable()
export class ProfilesMutationService {
  constructor(
    @inject(TYPES.ProfilesRepository)
    private profilesRepository: ProfilesRepository,
  ) {}

  async create(data: DBProfileInsert, dbOrTx?: DBOrTx): Promise<DBProfile> {
    return this.profilesRepository.create(data, dbOrTx);
  }

  async update(
    userId: string,
    data: DBProfileUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBProfile> {
    return this.profilesRepository.update(userId, data, dbOrTx);
  }
}
