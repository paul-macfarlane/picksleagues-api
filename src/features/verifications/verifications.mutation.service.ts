import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { VerificationsRepository } from "./verifications.repository";

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
