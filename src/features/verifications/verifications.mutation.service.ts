import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { VerificationsRepository } from "./verifications.repository.js";

@injectable()
export class VerificationsMutationService {
  constructor(
    @inject(TYPES.VerificationsRepository)
    private verificationsRepository: VerificationsRepository,
  ) {}

  async deleteByIdentifier(identifier: string, dbOrTx?: DBOrTx): Promise<void> {
    return this.verificationsRepository.deleteByIdentifier(identifier, dbOrTx);
  }
}
