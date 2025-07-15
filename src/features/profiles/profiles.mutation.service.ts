import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { ProfilesRepository } from "./profiles.repository";
import { DBProfile, DBProfileInsert, DBProfileUpdate } from "./profiles.types";

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
