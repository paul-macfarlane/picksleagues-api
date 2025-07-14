import { injectable, inject } from "inversify";
import { z } from "zod";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { ProfilesRepository } from "./profiles.repository";
import { DBProfile, SearchProfilesSchema } from "./profiles.types";

@injectable()
export class ProfilesQueryService {
  constructor(
    @inject(TYPES.ProfilesRepository)
    private profilesRepository: ProfilesRepository,
  ) {}

  async listByUserIds(
    userIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBProfile[]> {
    if (userIds.length === 0) {
      return [];
    }
    return this.profilesRepository.listByUserIds(userIds, dbOrTx);
  }

  async search(
    query: z.infer<typeof SearchProfilesSchema>,
    dbOrTx?: DBOrTx,
  ): Promise<DBProfile[]> {
    return this.profilesRepository.search(query, 10, dbOrTx);
  }

  async findByUserId(
    userId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBProfile | null> {
    return this.profilesRepository.findByUserId(userId, dbOrTx);
  }

  async isUsernameTaken(username: string, dbOrTx?: DBOrTx): Promise<boolean> {
    return this.profilesRepository.isUsernameTaken(username, dbOrTx);
  }
}
