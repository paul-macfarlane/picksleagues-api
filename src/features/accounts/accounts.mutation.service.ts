import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { AccountsRepository } from "./accounts.repository.js";

@injectable()
export class AccountsMutationService {
  constructor(
    @inject(TYPES.AccountsRepository)
    private accountsRepository: AccountsRepository,
  ) {}

  async deleteByUserId(userId: string, dbOrTx?: DBOrTx): Promise<void> {
    return this.accountsRepository.deleteByUserId(userId, dbOrTx);
  }
}
