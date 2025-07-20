import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { AccountsRepository } from "./accounts.repository";

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
