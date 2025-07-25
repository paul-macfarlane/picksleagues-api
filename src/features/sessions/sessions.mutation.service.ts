import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { SessionsRepository } from "./sessions.repository.js";

@injectable()
export class SessionsMutationService {
  constructor(
    @inject(TYPES.SessionsRepository)
    private sessionsRepository: SessionsRepository,
  ) {}

  async deleteByUserId(userId: string, dbOrTx?: DBOrTx): Promise<void> {
    return this.sessionsRepository.deleteByUserId(userId, dbOrTx);
  }
}
