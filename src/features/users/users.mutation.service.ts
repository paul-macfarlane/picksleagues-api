import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { UsersRepository } from "./users.repository.js";
import { db, DBOrTx } from "../../db/index.js";
import { DBUserUpdate } from "./users.types.js";

@injectable()
export class UsersMutationService {
  constructor(
    @inject(TYPES.UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async update(
    id: string,
    data: DBUserUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<void> {
    await this.usersRepository.update(id, data, dbOrTx);
  }
}
