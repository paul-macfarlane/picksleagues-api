import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { SessionsRepository } from "./sessions.repository";

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
